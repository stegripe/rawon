import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { OAuth } from "youtubei";

export interface OAuthTokens {
    accessToken: string;
    refreshToken: string;
    expiresAt: number;
}

const oauthCachePath = path.resolve(process.cwd(), "cache", "oauth.json");
const youtubeOAuthRefreshToken = process.env.YOUTUBE_OAUTH_REFRESH_TOKEN ?? "";

/**
 * Manager for YouTube OAuth tokens that auto-refreshes when needed.
 * Uses youtubei's OAuth capability to handle authentication.
 */
class OAuthManager {
    private tokens: OAuthTokens | null = null;
    private refreshPromise: Promise<OAuthTokens | null> | null = null;
    private readonly enabled: boolean;

    public constructor() {
        this.enabled = youtubeOAuthRefreshToken.length > 0;
        if (this.enabled) {
            this.loadCachedTokens();
        }
    }

    /**
     * Check if OAuth is enabled
     */
    public isEnabled(): boolean {
        return this.enabled;
    }

    /**
     * Get a valid OAuth access token, refreshing if necessary
     */
    public async getAccessToken(): Promise<string | null> {
        if (!this.enabled) {
            return null;
        }

        // Check if we have a valid token
        if (this.tokens && this.isTokenValid()) {
            return this.tokens.accessToken;
        }

        // Refresh the token
        const tokens = await this.refreshAccessToken();
        return tokens?.accessToken ?? null;
    }

    /**
     * Get the current OAuth tokens
     */
    public getTokens(): OAuthTokens | null {
        return this.tokens;
    }

    /**
     * Check if the current token is still valid (with 5 minute buffer)
     */
    private isTokenValid(): boolean {
        if (!this.tokens) {
            return false;
        }
        // Add 5 minute buffer before expiry
        const bufferMs = 5 * 60 * 1000;
        return Date.now() < this.tokens.expiresAt - bufferMs;
    }

    /**
     * Refresh the access token using the refresh token
     */
    private async refreshAccessToken(): Promise<OAuthTokens | null> {
        // If already refreshing, wait for that to complete
        if (this.refreshPromise) {
            return this.refreshPromise;
        }

        this.refreshPromise = this.doRefresh();
        try {
            return await this.refreshPromise;
        } finally {
            this.refreshPromise = null;
        }
    }

    /**
     * Actually perform the token refresh
     */
    private async doRefresh(): Promise<OAuthTokens | null> {
        try {
            console.info("[OAuthManager] Refreshing YouTube OAuth token...");
            const response = await OAuth.refreshToken(youtubeOAuthRefreshToken);

            this.tokens = {
                accessToken: response.accessToken,
                refreshToken: youtubeOAuthRefreshToken,
                expiresAt: Date.now() + response.expiresIn * 1000,
            };

            this.saveCachedTokens();
            console.info("[OAuthManager] YouTube OAuth token refreshed successfully");
            return this.tokens;
        } catch (error) {
            console.error("[OAuthManager] Failed to refresh YouTube OAuth token:", error);
            this.tokens = null;
            return null;
        }
    }

    /**
     * Load cached tokens from disk
     */
    private loadCachedTokens(): void {
        try {
            if (existsSync(oauthCachePath)) {
                const data = JSON.parse(readFileSync(oauthCachePath, "utf-8")) as OAuthTokens;
                if (
                    data.refreshToken === youtubeOAuthRefreshToken &&
                    this.isStoredTokenValid(data)
                ) {
                    this.tokens = data;
                    console.info("[OAuthManager] Loaded cached YouTube OAuth token");
                }
            }
        } catch {
            // Ignore errors loading cache
        }
    }

    /**
     * Check if stored token data is valid
     */
    private isStoredTokenValid(data: OAuthTokens): boolean {
        const bufferMs = 5 * 60 * 1000;
        return Date.now() < data.expiresAt - bufferMs;
    }

    /**
     * Save tokens to disk cache
     */
    private saveCachedTokens(): void {
        try {
            const cacheDir = path.dirname(oauthCachePath);
            if (!existsSync(cacheDir)) {
                mkdirSync(cacheDir, { recursive: true });
            }
            writeFileSync(oauthCachePath, JSON.stringify(this.tokens), "utf-8");
        } catch {
            // Ignore errors saving cache
        }
    }
}

// Export a singleton instance
export const oauthManager = new OAuthManager();
