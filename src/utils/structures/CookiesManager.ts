import { existsSync, statSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { container } from "@sapphire/framework";
import { devtoolsPort } from "../../config/env.js";
import { type Rawon } from "../../structures/Rawon.js";
import { GoogleLoginManager, type LoginSessionInfo } from "./GoogleLoginManager.js";

export type CookieStatus = "active" | "missing";

export interface CookieInfo {
    status: CookieStatus;
    filePath: string;
    size: number;
    lastRefresh: number | null;
    loginEmail: string | null;
    browserRunning: boolean;
}

let sharedLoginManager: GoogleLoginManager | null = null;

function getSharedLoginManager(): GoogleLoginManager {
    if (!sharedLoginManager) {
        const chromiumPath = process.env.CHROMIUM_PATH || undefined;
        sharedLoginManager = new GoogleLoginManager(chromiumPath, devtoolsPort);
    }
    return sharedLoginManager;
}

export class CookiesManager {
    public readonly cookiesDir: string;
    public readonly loginManager: GoogleLoginManager;

    public constructor(public readonly client: Rawon) {
        this.cookiesDir = path.resolve(process.cwd(), "cache", "cookies");
        this.loginManager = getSharedLoginManager();
    }

    public async initialize(): Promise<void> {
        container.logger.info("[Cookies] Initializing cookie manager...");

        // Restore session info (email, etc.) from DB without launching browser
        const restored = this.loginManager.restoreSessionFromDB();

        if (this.loginManager.hasCookies()) {
            container.logger.info(
                `[Cookies] Found existing cookies on disk${restored ? ` (account: ${this.loginManager.getSessionInfo().email ?? "unknown"})` : ""}. Ready to use.`,
            );
        } else {
            container.logger.info(
                "[Cookies] No cookies found. Use the login command to authenticate.",
            );
        }
    }

    public getCurrentCookiePath(): string | null {
        const cookiePath = this.loginManager.getCookiesFilePath();

        if (!existsSync(cookiePath)) {
            return null;
        }

        try {
            const stats = statSync(cookiePath);
            if (stats.size === 0) {
                return null;
            }
        } catch {
            return null;
        }

        return cookiePath;
    }

    /**
     * Called when bot detection is encountered.
     * Logs a warning telling the user to re-login. Does NOT auto-rotate or retry.
     */
    public handleBotDetection(): void {
        container.logger.warn(
            "[Cookies] Bot detection triggered. Cookies may be stale or invalid. " +
                "Use `xlogin logout` then `xlogin start` to re-login.",
        );
    }

    /**
     * Returns true if there are no valid cookies available.
     */
    public hasNoCookies(): boolean {
        return this.getCurrentCookiePath() === null;
    }

    public getCookieInfo(): CookieInfo {
        const cookiePath = this.loginManager.getCookiesFilePath();
        const sessionInfo = this.loginManager.getSessionInfo();

        let status: CookieStatus = "missing";
        let size = 0;

        if (existsSync(cookiePath)) {
            try {
                const stats = statSync(cookiePath);
                size = stats.size;

                if (size > 0) {
                    status = "active";
                }
            } catch {
                // File error
            }
        }

        return {
            status,
            filePath: cookiePath,
            size,
            lastRefresh: sessionInfo.lastCookieRefresh,
            loginEmail: sessionInfo.email,
            browserRunning: this.loginManager.isBrowserRunning(),
        };
    }

    public getLoginSessionInfo(): LoginSessionInfo {
        return this.loginManager.getSessionInfo();
    }

    public async shutdown(): Promise<void> {
        await this.loginManager.shutdown();
    }

    public async close(): Promise<void> {
        await this.loginManager.close();
    }

    public getExtractorArgs(): string | null {
        return this.loginManager.getExtractorArgs();
    }
}
