import { existsSync, mkdirSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { setTimeout } from "node:timers";
import YTI from "youtubei";

const { OAuth } = YTI;

export interface YouTubeOAuthData {
    accessToken: string;
    refreshToken: string;
    expiresAt: number;
}

export interface OAuthDeviceFlowResult {
    deviceCode: string;
    userCode: string;
    expiresIn: number;
    interval: number;
    verificationUrl: string;
}

/**
 * Manages YouTube OAuth tokens for auto-renewal capabilities.
 * This allows the bot to authenticate with YouTube without requiring
 * manual cookie setup and maintenance.
 */
export class YouTubeOAuthManager {
    private static readonly OAUTH_FILE_PATH = path.resolve(
        process.cwd(),
        "cache",
        "youtube_oauth.json",
    );
    private oauthData: YouTubeOAuthData | null = null;
    private refreshPromise: Promise<void> | null = null;

    public constructor() {
        this.ensureDirectory();
    }

    private ensureDirectory(): void {
        const dir = path.dirname(YouTubeOAuthManager.OAUTH_FILE_PATH);
        if (!existsSync(dir)) {
            mkdirSync(dir, { recursive: true });
        }
    }

    /**
     * Load OAuth data from file
     */
    public async load(): Promise<boolean> {
        try {
            if (existsSync(YouTubeOAuthManager.OAUTH_FILE_PATH)) {
                const data = await readFile(YouTubeOAuthManager.OAUTH_FILE_PATH, "utf8");
                this.oauthData = JSON.parse(data) as YouTubeOAuthData;
                return true;
            }
            return false;
        } catch {
            return false;
        }
    }

    /**
     * Save OAuth data to file
     */
    private async save(): Promise<void> {
        if (this.oauthData) {
            await writeFile(
                YouTubeOAuthManager.OAUTH_FILE_PATH,
                JSON.stringify(this.oauthData, null, 2),
            );
        }
    }

    /**
     * Check if OAuth is configured
     */
    public isConfigured(): boolean {
        return this.oauthData !== null && Boolean(this.oauthData.refreshToken);
    }

    /**
     * Get the current access token, refreshing if necessary
     */
    public async getAccessToken(): Promise<string | null> {
        if (!this.oauthData) {
            return null;
        }

        // Check if token is expired or will expire in the next 5 minutes
        const expiresIn5Minutes = Date.now() + 5 * 60 * 1000;
        if (this.oauthData.expiresAt < expiresIn5Minutes) {
            await this.refreshAccessToken();
        }

        return this.oauthData?.accessToken ?? null;
    }

    /**
     * Refresh the access token using the refresh token
     */
    private async refreshAccessToken(): Promise<void> {
        if (!this.oauthData?.refreshToken) {
            throw new Error("No refresh token available");
        }

        // Prevent concurrent refresh attempts
        if (this.refreshPromise) {
            await this.refreshPromise;
            return;
        }

        this.refreshPromise = (async () => {
            try {
                const response = await OAuth.refreshToken(this.oauthData!.refreshToken);
                this.oauthData = {
                    accessToken: response.accessToken,
                    refreshToken: this.oauthData!.refreshToken,
                    expiresAt: Date.now() + response.expiresIn * 1000,
                };
                await this.save();
            } finally {
                this.refreshPromise = null;
            }
        })();

        await this.refreshPromise;
    }

    /**
     * Start the OAuth device flow for initial authorization.
     * Returns the device flow info that should be shown to the user.
     */
    public async startDeviceFlow(): Promise<OAuthDeviceFlowResult> {
        const result = await OAuth.authorize(true);
        if (!("deviceCode" in result)) {
            throw new Error("Failed to start device flow");
        }
        return result as OAuthDeviceFlowResult;
    }

    /**
     * Complete the device flow authorization using the device code.
     * This should be called after the user has entered the code at the verification URL.
     */
    public async completeDeviceFlow(deviceCode: string, interval: number): Promise<boolean> {
        let attempts = 0;
        const maxAttempts = 60; // About 5 minutes with 5s intervals

        while (attempts < maxAttempts) {
            try {
                const response = await OAuth.authenticate(deviceCode);
                this.oauthData = {
                    accessToken: response.accessToken,
                    refreshToken: response.refreshToken,
                    expiresAt: Date.now() + response.expiresIn * 1000,
                };
                await this.save();
                return true;
            } catch (error) {
                const message = (error as Error).message;
                if (message === "authorization_pending") {
                    // User hasn't authorized yet, wait and retry
                    await new Promise((resolve) => setTimeout(resolve, interval * 1000));
                    attempts++;
                } else if (message === "expired_token") {
                    // Token expired, need to start over
                    return false;
                } else {
                    throw error;
                }
            }
        }

        return false;
    }

    /**
     * Clear OAuth data (logout)
     */
    public async clear(): Promise<void> {
        this.oauthData = null;
        try {
            const { unlink } = await import("node:fs/promises");
            if (existsSync(YouTubeOAuthManager.OAUTH_FILE_PATH)) {
                await unlink(YouTubeOAuthManager.OAUTH_FILE_PATH);
            }
        } catch {
            // Ignore errors when deleting file
        }
    }

    /**
     * Get OAuth data expiry information
     */
    public getExpiryInfo(): { expiresAt: Date; isExpired: boolean } | null {
        if (!this.oauthData) {
            return null;
        }

        const expiresAt = new Date(this.oauthData.expiresAt);
        return {
            expiresAt,
            isExpired: Date.now() > this.oauthData.expiresAt,
        };
    }
}
