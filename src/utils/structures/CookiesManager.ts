import {
    existsSync,
    mkdirSync,
    readdirSync,
    readFileSync,
    rmSync,
    statSync,
    writeFileSync,
} from "node:fs";
import path from "node:path";
import process from "node:process";
import { container } from "@sapphire/framework";
import { type Rawon } from "../../structures/Rawon.js";

export type CookieStatus = "active" | "available" | "failed";

export interface CookieInfo {
    index: number;
    filename: string;
    size: number;
    status: CookieStatus;
}

const FAILED_COOKIE_EXPIRY_MS = 30 * 60 * 1000;

/**
 * CookiesManager handles cookie rotation for yt-dlp to avoid bot detection.
 *
 * Cookie files are stored in: `cache/cookies/`
 * Naming convention: `cookies-{n}.txt`
 *
 * State is persisted in SQLite via SQLiteDataManager.
 */
export class CookiesManager {
    public readonly cookiesDir: string;

    private currentCookieIndex = 1;
    private failedCookies = new Set<number>();
    private failureTimestamps = new Map<number, number>();
    private allCookiesFailed = false;
    private cache: string[] | null = null;

    public constructor(public readonly client: Rawon) {
        this.cookiesDir = path.resolve(process.cwd(), "cache", "cookies");
        this.ensureDirectory();
        this.loadState();
        this.initializeCurrentCookie();
    }

    private ensureDirectory(): void {
        if (!existsSync(this.cookiesDir)) {
            mkdirSync(this.cookiesDir, { recursive: true });
        }
    }

    private loadState(): void {
        try {
            const state = this.client.data.getCookiesState();
            if (!state) {
                return;
            }

            const now = Date.now();
            for (const index of state.failedCookies) {
                const failureTime = state.failureTimestamps[index] ?? 0;
                if (now - failureTime < FAILED_COOKIE_EXPIRY_MS) {
                    this.failedCookies.add(index);
                    this.failureTimestamps.set(index, failureTime);
                }
            }

            if (state.currentCookieIndex > 0) {
                this.currentCookieIndex = state.currentCookieIndex;
            }

            if (this.failedCookies.size > 0) {
                container.logger.info(
                    `[Cookies] Restored ${this.failedCookies.size} failed cookie(s) from previous session`,
                );
            }
        } catch (err) {
            container.logger.warn("[Cookies] Could not load previous state:", err);
        }
    }

    private saveState(): void {
        try {
            void this.client.data.saveCookiesState({
                failedCookies: Array.from(this.failedCookies),
                currentCookieIndex: this.currentCookieIndex,
                failureTimestamps: Object.fromEntries(this.failureTimestamps),
            });
        } catch (err) {
            container.logger.warn("[Cookies] Could not save state:", err);
        }
    }

    private initializeCurrentCookie(): void {
        const cookies = this.listCookies();
        if (cookies.length === 0) {
            container.logger.debug("[Cookies] No cookies available");
            return;
        }

        if (
            this.failedCookies.has(this.currentCookieIndex) ||
            !this.isCookieValid(this.currentCookieIndex)
        ) {
            for (const index of cookies) {
                if (!this.failedCookies.has(index) && this.isCookieValid(index)) {
                    this.currentCookieIndex = index;
                    this.saveState();
                    container.logger.info(`[Cookies] Initialized with cookie #${index}`);
                    return;
                }
            }
            this.allCookiesFailed = true;
            container.logger.warn("[Cookies] No valid cookies available");
        } else {
            container.logger.debug(`[Cookies] Using existing cookie #${this.currentCookieIndex}`);
        }
    }

    public clearCache(): void {
        this.cache = null;
    }

    public getCookiePath(index: number): string {
        return path.join(this.cookiesDir, `cookies-${index}.txt`);
    }

    public isCookieValid(index: number): boolean {
        const cookiePath = this.getCookiePath(index);
        if (!existsSync(cookiePath)) {
            return false;
        }

        try {
            const stats = statSync(cookiePath);
            return stats.size > 0;
        } catch {
            return false;
        }
    }

    public getCurrentCookiePath(): string | null {
        if (this.allCookiesFailed) {
            return null;
        }

        const cookies = this.listCookies();
        if (cookies.length === 0) {
            return null;
        }

        if (
            this.isCookieValid(this.currentCookieIndex) &&
            !this.failedCookies.has(this.currentCookieIndex)
        ) {
            return this.getCookiePath(this.currentCookieIndex);
        }

        if (!this.isCookieValid(this.currentCookieIndex)) {
            container.logger.warn(
                `[Cookies] Cookie #${this.currentCookieIndex} is invalid, auto-rotating...`,
            );
            this.failedCookies.add(this.currentCookieIndex);
            this.failureTimestamps.set(this.currentCookieIndex, Date.now());
        }

        for (const index of cookies) {
            if (!this.failedCookies.has(index) && this.isCookieValid(index)) {
                this.currentCookieIndex = index;
                this.saveState();
                container.logger.info(`[Cookies] Auto-rotated to cookie #${index}`);
                return this.getCookiePath(index);
            }
        }

        this.allCookiesFailed = true;
        return null;
    }

    public rotateOnFailure(): boolean {
        const cookies = this.listCookies();
        if (cookies.length === 0) {
            this.allCookiesFailed = true;
            this.saveState();
            return false;
        }

        this.failedCookies.add(this.currentCookieIndex);
        this.failureTimestamps.set(this.currentCookieIndex, Date.now());
        container.logger.warn(
            `[Cookies] Cookie #${this.currentCookieIndex} marked as failed (${this.failedCookies.size}/${cookies.length} failed)`,
        );

        for (const index of cookies) {
            if (!this.failedCookies.has(index) && this.isCookieValid(index)) {
                this.currentCookieIndex = index;
                this.saveState();
                container.logger.info(`[Cookies] Rotated to cookie #${index}`);
                return true;
            }
        }

        this.allCookiesFailed = true;
        this.saveState();
        container.logger.error("[Cookies] All cookies have failed, please add new cookies");
        return false;
    }

    public resetFailedStatus(): void {
        this.failedCookies.clear();
        this.failureTimestamps.clear();
        this.allCookiesFailed = false;
        this.initializeCurrentCookie();
        this.saveState();
        container.logger.info("[Cookies] Reset all failed cookie statuses");
    }

    public areAllCookiesFailed(): boolean {
        return this.allCookiesFailed;
    }

    public listCookies(): number[] {
        if (this.cache !== null) {
            return this.parseCookieIndicesFromCache();
        }

        if (!existsSync(this.cookiesDir)) {
            return [];
        }

        try {
            const files = readdirSync(this.cookiesDir);
            this.cache = files;
            return this.parseCookieIndicesFromCache();
        } catch {
            return [];
        }
    }

    private parseCookieIndicesFromCache(): number[] {
        if (!this.cache) {
            return [];
        }

        const cookieIndices: number[] = [];

        for (const file of this.cache) {
            const match = /^cookies-(\d+)\.txt$/u.exec(file);
            if (match) {
                const index = Number.parseInt(match[1], 10);
                if (!Number.isNaN(index) && this.isCookieValid(index)) {
                    cookieIndices.push(index);
                }
            }
        }

        return cookieIndices.sort((a, b) => a - b);
    }

    public addCookie(index: number, content: string): "added" | "replaced" | false {
        try {
            const cookiePath = this.getCookiePath(index);
            const existed = existsSync(cookiePath);

            writeFileSync(cookiePath, content, "utf8");

            this.failedCookies.delete(index);
            this.failureTimestamps.delete(index);

            if (this.allCookiesFailed) {
                this.allCookiesFailed = false;
                this.currentCookieIndex = index;
            }

            this.clearCache();
            this.saveState();

            container.logger.info(`[Cookies] ${existed ? "Replaced" : "Added"} cookie #${index}`);
            return existed ? "replaced" : "added";
        } catch (err) {
            container.logger.error(`[Cookies] Failed to add cookie #${index}:`, err);
            return false;
        }
    }

    public removeCookie(index: number): boolean {
        try {
            const cookiePath = this.getCookiePath(index);
            if (!existsSync(cookiePath)) {
                return false;
            }

            rmSync(cookiePath, { force: true });
            this.failedCookies.delete(index);
            this.failureTimestamps.delete(index);

            if (this.currentCookieIndex === index) {
                this.initializeCurrentCookie();
            }

            this.clearCache();
            this.saveState();

            container.logger.info(`[Cookies] Removed cookie #${index}`);
            return true;
        } catch (err) {
            container.logger.error(`[Cookies] Failed to remove cookie #${index}:`, err);
            return false;
        }
    }

    public removeAllCookies(): number {
        const cookies = this.listCookies();
        let removed = 0;

        for (const index of cookies) {
            const cookiePath = this.getCookiePath(index);
            try {
                if (existsSync(cookiePath)) {
                    rmSync(cookiePath, { force: true });
                    removed++;
                }
            } catch {
                // Ignore errors
            }
        }

        this.failedCookies.clear();
        this.failureTimestamps.clear();
        this.allCookiesFailed = false;
        this.currentCookieIndex = 1;
        this.clearCache();
        this.saveState();

        container.logger.info(`[Cookies] Removed all ${removed} cookie(s)`);
        return removed;
    }

    public getCookieStatus(index: number): CookieStatus {
        if (this.currentCookieIndex === index && !this.failedCookies.has(index)) {
            return "active";
        }
        if (this.failedCookies.has(index)) {
            return "failed";
        }
        return "available";
    }

    public getCurrentCookieIndex(): number {
        return this.currentCookieIndex;
    }

    public getCookieCount(): number {
        return this.listCookies().length;
    }

    public getFailedCookieCount(): number {
        return this.failedCookies.size;
    }

    public getCookieContent(index: number): string | null {
        try {
            const cookiePath = this.getCookiePath(index);
            if (existsSync(cookiePath)) {
                return readFileSync(cookiePath, "utf8");
            }
            return null;
        } catch {
            return null;
        }
    }

    public useCookie(index: number): "success" | "not_found" | "failed" {
        if (!this.isCookieValid(index)) {
            return "not_found";
        }
        if (this.failedCookies.has(index)) {
            return "failed";
        }

        this.currentCookieIndex = index;
        this.allCookiesFailed = false;
        this.saveState();

        container.logger.info(`[Cookies] Manually switched to cookie #${index}`);
        return "success";
    }

    public getAllCookieInfo(): CookieInfo[] {
        const cookies = this.listCookies();
        const infos: CookieInfo[] = [];

        for (const index of cookies) {
            const cookiePath = this.getCookiePath(index);
            try {
                const stats = statSync(cookiePath);
                infos.push({
                    index,
                    filename: path.basename(cookiePath),
                    size: stats.size,
                    status: this.getCookieStatus(index),
                });
            } catch {
                // Skip invalid files
            }
        }

        return infos;
    }
}
