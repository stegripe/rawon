import { randomBytes } from "node:crypto";
import { existsSync, mkdirSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { setTimeout } from "node:timers/promises";

const OAUTH_FILE = path.resolve(process.cwd(), "cache", "youtube-oauth.json");

// These are YouTube's public TV client credentials, same as used by youtubei library
// They are intentionally public for device OAuth flow (like smart TVs, game consoles)
// See: https://github.com/AJenbo/agern/blob/master/src/youtube.ts
const CLIENT_ID = "861556708454-d6dlm3lh05idd8npek18k6be8ba3oc68.apps.googleusercontent.com";
const CLIENT_SECRET = "SboVhoG9s0rNafixCSGGKXAT";
const SCOPE = "http://gdata.youtube.com https://www.googleapis.com/auth/youtube";

interface OAuthData {
    refreshToken: string;
    accessToken: string | null;
    expiresAt: number | null;
}

interface DeviceCodeResponse {
    deviceCode: string;
    userCode: string;
    expiresIn: number;
    interval: number;
    verificationUrl: string;
}

interface TokenResponse {
    accessToken: string;
    expiresIn: number;
    refreshToken?: string;
    scope: string;
    tokenType: string;
}

export class YouTubeOAuthManager {
    private data: OAuthData | null = null;
    private refreshPromise: Promise<string | null> | null = null;

    public constructor() {
        this.ensureDirectory();
        void this.load();
    }

    private ensureDirectory(): void {
        const dir = path.dirname(OAUTH_FILE);
        if (!existsSync(dir)) {
            mkdirSync(dir, { recursive: true });
        }
    }

    public get isConfigured(): boolean {
        return this.data?.refreshToken !== undefined && this.data.refreshToken.length > 0;
    }

    public async getAccessToken(): Promise<string | null> {
        if (!this.data?.refreshToken) {
            return null;
        }

        // Check if current token is still valid (with 5 min buffer)
        if (
            this.data.accessToken &&
            this.data.expiresAt &&
            this.data.expiresAt - 5 * 60 * 1000 > Date.now()
        ) {
            return this.data.accessToken;
        }

        // Refresh token - ensure only one refresh at a time
        if (!this.refreshPromise) {
            this.refreshPromise = this.refreshAccessToken();
        }

        try {
            return await this.refreshPromise;
        } finally {
            this.refreshPromise = null;
        }
    }

    private async refreshAccessToken(): Promise<string | null> {
        if (!this.data?.refreshToken) {
            return null;
        }

        try {
            const response = await fetch("https://www.youtube.com/o/oauth2/token", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    __youtube_oauth__: "True",
                },
                body: JSON.stringify({
                    client_id: CLIENT_ID,
                    client_secret: CLIENT_SECRET,
                    refresh_token: this.data.refreshToken,
                    grant_type: "refresh_token",
                }),
            });

            if (response.ok) {
                const data = (await response.json()) as {
                    access_token?: string;
                    expires_in?: number;
                    error?: string;
                };
                if (data.error) {
                    console.error("[YouTubeOAuth] Token refresh error:", data.error);
                    return null;
                }

                this.data.accessToken = data.access_token ?? null;
                this.data.expiresAt = data.expires_in ? Date.now() + data.expires_in * 1000 : null;
                await this.save();

                console.info("[YouTubeOAuth] Access token refreshed successfully");
                return this.data.accessToken;
            }

            console.error("[YouTubeOAuth] Token refresh failed:", response.status);
            return null;
        } catch (error) {
            console.error("[YouTubeOAuth] Token refresh error:", error);
            return null;
        }
    }

    public async startDeviceFlow(): Promise<DeviceCodeResponse> {
        const response = await fetch("https://www.youtube.com/o/oauth2/device/code", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                __youtube_oauth__: "True",
            },
            body: JSON.stringify({
                client_id: CLIENT_ID,
                scope: SCOPE,
                device_id: randomBytes(20).toString("hex"),
                device_model: "ytlr::",
            }),
        });

        if (!response.ok) {
            throw new Error(`Device code request failed: ${response.status}`);
        }

        const data = (await response.json()) as {
            device_code: string;
            user_code: string;
            expires_in: number;
            interval: number;
            verification_url: string;
        };

        return {
            deviceCode: data.device_code,
            userCode: data.user_code,
            expiresIn: data.expires_in,
            interval: data.interval,
            verificationUrl: data.verification_url,
        };
    }

    public async pollForToken(
        deviceCode: string,
        interval: number,
        expiresIn = 1800,
    ): Promise<TokenResponse> {
        const body = {
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            code: deviceCode,
            grant_type: "http://oauth.net/grant_type/device/1.0",
        };

        const startTime = Date.now();
        const maxWaitTime = expiresIn * 1000; // Convert to milliseconds

        while (Date.now() - startTime < maxWaitTime) {
            await setTimeout(interval * 1000);

            const response = await fetch("https://www.youtube.com/o/oauth2/token", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    __youtube_oauth__: "True",
                },
                body: JSON.stringify(body),
            });

            if (!response.ok) {
                throw new Error(`Token request failed: ${response.status}`);
            }

            const data = (await response.json()) as {
                error?: string;
                access_token?: string;
                expires_in?: number;
                refresh_token?: string;
                scope?: string;
                token_type?: string;
            };

            if (data.error === "authorization_pending") {
                continue;
            }

            if (data.error === "expired_token") {
                throw new Error("Authorization expired. Please try again.");
            }

            if (data.error) {
                throw new Error(`Authorization error: ${data.error}`);
            }

            return {
                accessToken: data.access_token ?? "",
                expiresIn: data.expires_in ?? 0,
                refreshToken: data.refresh_token,
                scope: data.scope ?? "",
                tokenType: data.token_type ?? "",
            };
        }

        throw new Error("Authorization timed out. Please try again.");
    }

    public async saveTokens(tokens: TokenResponse): Promise<void> {
        this.data = {
            refreshToken: tokens.refreshToken ?? "",
            accessToken: tokens.accessToken,
            expiresAt: Date.now() + tokens.expiresIn * 1000,
        };
        await this.save();
    }

    public async clearTokens(): Promise<void> {
        this.data = null;
        try {
            const { unlink } = await import("node:fs/promises");
            await unlink(OAUTH_FILE);
        } catch {
            // File might not exist
        }
    }

    private async save(): Promise<void> {
        if (!this.data) {
            return;
        }
        await writeFile(OAUTH_FILE, JSON.stringify(this.data, null, 2));
    }

    private async load(): Promise<void> {
        try {
            if (existsSync(OAUTH_FILE)) {
                const content = await readFile(OAUTH_FILE, "utf8");
                this.data = JSON.parse(content) as OAuthData;
            }
        } catch (error) {
            console.error("[YouTubeOAuth] Failed to load OAuth data:", error);
        }
    }
}

// Singleton instance
export const youtubeOAuth = new YouTubeOAuthManager();
