import { existsSync, statSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { container } from "@sapphire/framework";
import { devtoolsPort } from "../../config/env.js";
import { type Rawon } from "../../structures/Rawon.js";
import { GoogleLoginManager, type LoginSessionInfo } from "./GoogleLoginManager.js";

export type CookieStatus = "active" | "stale" | "missing";

export interface CookieInfo {
    status: CookieStatus;
    filePath: string;
    size: number;
    lastRefresh: number | null;
    loginEmail: string | null;
    browserRunning: boolean;
}

const COOKIE_STALE_THRESHOLD_MS = 2 * 60 * 60 * 1000;

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
    private botDetectionCount = 0;
    private lastBotDetection: number | null = null;

    private static readonly MAX_BOT_DETECTIONS_BEFORE_REFRESH = 3;
    private static readonly BOT_DETECTION_WINDOW_MS = 5 * 60 * 1000;

    public constructor(public readonly client: Rawon) {
        this.cookiesDir = path.resolve(process.cwd(), "cache", "cookies");
        this.loginManager = getSharedLoginManager();
    }

    public async initialize(): Promise<void> {
        container.logger.info("[Cookies] Initializing cookie manager...");

        if (this.loginManager.hasCookies()) {
            container.logger.info("[Cookies] Found existing cookie file from previous session");
        } else {
            container.logger.info(
                "[Cookies] No cookies found. If you encounter bot detection errors, use the login command.",
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

    public async rotateOnFailure(): Promise<boolean> {
        const now = Date.now();

        if (
            this.lastBotDetection &&
            now - this.lastBotDetection > CookiesManager.BOT_DETECTION_WINDOW_MS
        ) {
            this.botDetectionCount = 0;
        }

        this.botDetectionCount++;
        this.lastBotDetection = now;

        container.logger.warn(
            `[Cookies] Bot detection #${this.botDetectionCount} in current window`,
        );

        if (
            this.botDetectionCount >= CookiesManager.MAX_BOT_DETECTIONS_BEFORE_REFRESH &&
            this.loginManager.isBrowserRunning()
        ) {
            container.logger.info(
                "[Cookies] Attempting cookie refresh due to repeated bot detection...",
            );

            try {
                await this.loginManager.refreshCookiesNow();
                this.botDetectionCount = 0;
                container.logger.info(
                    "[Cookies] Cookies refreshed successfully after bot detection",
                );
                return true;
            } catch (err) {
                container.logger.error("[Cookies] Cookie refresh failed:", err);
                return false;
            }
        }

        if (this.getCurrentCookiePath()) {
            return this.botDetectionCount < CookiesManager.MAX_BOT_DETECTIONS_BEFORE_REFRESH;
        }

        container.logger.warn(
            "[Cookies] No cookies available and browser is not running. " +
                "Use the login command to log in to Google and fix bot detection errors.",
        );

        return false;
    }

    public areAllCookiesFailed(): boolean {
        if (!this.getCurrentCookiePath()) {
            return true;
        }

        if (
            this.botDetectionCount >= CookiesManager.MAX_BOT_DETECTIONS_BEFORE_REFRESH &&
            !this.loginManager.isBrowserRunning()
        ) {
            return true;
        }

        return false;
    }

    public resetFailedStatus(): void {
        this.botDetectionCount = 0;
        this.lastBotDetection = null;
        container.logger.info("[Cookies] Reset bot detection counter");
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
                    const lastRefresh = sessionInfo.lastCookieRefresh;
                    if (
                        lastRefresh &&
                        Date.now() - lastRefresh > COOKIE_STALE_THRESHOLD_MS &&
                        !this.loginManager.isBrowserRunning()
                    ) {
                        status = "stale";
                    } else {
                        status = "active";
                    }
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

    public getBotDetectionStats(): {
        count: number;
        lastDetection: number | null;
        threshold: number;
    } {
        return {
            count: this.botDetectionCount,
            lastDetection: this.lastBotDetection,
            threshold: CookiesManager.MAX_BOT_DETECTIONS_BEFORE_REFRESH,
        };
    }

    public async close(): Promise<void> {
        await this.loginManager.close();
    }

    public getCurrentCookieIndex(): number {
        return this.getCurrentCookiePath() ? 1 : 0;
    }

    public getCookieCount(): number {
        return this.getCurrentCookiePath() ? 1 : 0;
    }

    public getFailedCookieCount(): number {
        return this.areAllCookiesFailed() ? 1 : 0;
    }
}
