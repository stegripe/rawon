import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { type Rawon } from "../../structures/Rawon.js";

interface CookieState {
    failedCookies: number[];
    currentCookieIndex: number;
    failureTimestamps: Record<number, number>;
}

const FAILED_COOKIE_EXPIRY_MS = 30 * 60 * 1000;

export class CookiesManager {
    public readonly cookiesDir: string;
    private readonly stateFilePath: string;
    private currentCookieIndex = 1;
    private failedCookies = new Set<number>();
    private failureTimestamps = new Map<number, number>();
    private allCookiesFailed = false;

    public constructor(public readonly client: Rawon) {
        this.cookiesDir = path.resolve(process.cwd(), "cache", "cookies");
        this.stateFilePath = path.join(this.cookiesDir, ".cookie-state.json");
        this.ensureCookiesDir();
        this.loadState();
        this.initializeCurrentCookie();
    }

    private ensureCookiesDir(): void {
        if (!existsSync(this.cookiesDir)) {
            mkdirSync(this.cookiesDir, { recursive: true });
        }
    }

    private loadState(): void {
        try {
            if (existsSync(this.stateFilePath)) {
                const content = readFileSync(this.stateFilePath, "utf8");
                const state: CookieState = JSON.parse(content);

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

                this.client.logger.info(
                    `[CookiesManager] Loaded state: ${this.failedCookies.size} failed cookies (from previous session)`,
                );
            }
        } catch (error) {
            this.client.logger.warn("[CookiesManager] Could not load previous state:", error);
        }
    }

    private saveState(): void {
        try {
            const state: CookieState = {
                failedCookies: Array.from(this.failedCookies),
                currentCookieIndex: this.currentCookieIndex,
                failureTimestamps: Object.fromEntries(this.failureTimestamps),
            };
            writeFileSync(this.stateFilePath, JSON.stringify(state, null, 2), "utf8");
        } catch (error) {
            this.client.logger.warn("[CookiesManager] Could not save state:", error);
        }
    }

    private initializeCurrentCookie(): void {
        const cookies = this.listCookies();
        if (cookies.length === 0) {
            return;
        }

        if (
            this.failedCookies.has(this.currentCookieIndex) ||
            !existsSync(this.getCookiePath(this.currentCookieIndex))
        ) {
            for (const index of cookies) {
                if (!this.failedCookies.has(index)) {
                    this.currentCookieIndex = index;
                    this.saveState();
                    return;
                }
            }
            this.allCookiesFailed = true;
        }
    }

    public getCookiePath(index: number): string {
        return path.join(this.cookiesDir, `cookies-${index}.txt`);
    }

    public getCurrentCookiePath(): string | null {
        if (this.allCookiesFailed) {
            return null;
        }

        const cookies = this.listCookies();
        if (cookies.length === 0) {
            return null;
        }

        const cookiePath = this.getCookiePath(this.currentCookieIndex);
        if (existsSync(cookiePath) && !this.failedCookies.has(this.currentCookieIndex)) {
            return cookiePath;
        }

        for (const index of cookies) {
            if (!this.failedCookies.has(index)) {
                this.currentCookieIndex = index;
                this.saveState();
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
        this.client.logger.warn(
            `[CookiesManager] Cookie ${this.currentCookieIndex} marked as failed. Failed cookies: ${Array.from(this.failedCookies).join(", ")}`,
        );

        for (const index of cookies) {
            if (!this.failedCookies.has(index)) {
                this.currentCookieIndex = index;
                this.saveState();
                this.client.logger.info(
                    `[CookiesManager] Rotated to cookie ${this.currentCookieIndex}`,
                );
                return true;
            }
        }

        this.allCookiesFailed = true;
        this.saveState();
        this.client.logger.error(
            "[CookiesManager] All cookies have failed. Please add new cookies.",
        );
        return false;
    }

    public resetFailedStatus(): void {
        this.failedCookies.clear();
        this.failureTimestamps.clear();
        this.allCookiesFailed = false;
        this.initializeCurrentCookie();
        this.saveState();
        this.client.logger.info("[CookiesManager] Reset all failed cookie statuses.");
    }

    public areAllCookiesFailed(): boolean {
        return this.allCookiesFailed;
    }

    public listCookies(): number[] {
        if (!existsSync(this.cookiesDir)) {
            return [];
        }

        const files = readdirSync(this.cookiesDir);
        const cookieIndices: number[] = [];

        for (const file of files) {
            const match = /^cookies-(\d+)\.txt$/u.exec(file);
            if (match) {
                const index = Number.parseInt(match[1], 10);
                if (!Number.isNaN(index) && existsSync(this.getCookiePath(index))) {
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

            this.saveState();
            this.client.logger.info(
                `[CookiesManager] ${existed ? "Replaced" : "Added"} cookie ${index}`,
            );
            return existed ? "replaced" : "added";
        } catch (error) {
            this.client.logger.error(`[CookiesManager] Failed to add cookie ${index}:`, error);
            return false;
        }
    }

    public removeCookie(index: number): boolean {
        try {
            const cookiePath = this.getCookiePath(index);
            if (existsSync(cookiePath)) {
                rmSync(cookiePath, { force: true });
                this.failedCookies.delete(index);
                this.failureTimestamps.delete(index);

                if (this.currentCookieIndex === index) {
                    this.initializeCurrentCookie();
                }

                this.saveState();
                this.client.logger.info(`[CookiesManager] Removed cookie ${index}`);
                return true;
            }
            return false;
        } catch (error) {
            this.client.logger.error(`[CookiesManager] Failed to remove cookie ${index}:`, error);
            return false;
        }
    }

    public removeAllCookies(): number {
        const cookies = this.listCookies();
        let removed = 0;

        for (const index of cookies) {
            if (this.removeCookie(index)) {
                removed++;
            }
        }

        this.failedCookies.clear();
        this.failureTimestamps.clear();
        this.allCookiesFailed = false;
        this.currentCookieIndex = 1;

        this.saveState();
        this.client.logger.info(`[CookiesManager] Removed all ${removed} cookies`);
        return removed;
    }

    public getCookieStatus(index: number): "active" | "failed" | "available" {
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
        const cookiePath = this.getCookiePath(index);
        if (!existsSync(cookiePath)) {
            return "not_found";
        }

        if (this.failedCookies.has(index)) {
            return "failed";
        }

        this.currentCookieIndex = index;
        this.allCookiesFailed = false;
        this.saveState();
        this.client.logger.info(`[CookiesManager] Manually switched to cookie ${index}`);
        return "success";
    }
}
