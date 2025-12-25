import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { type Rawon } from "../../structures/Rawon.js";

export class CookiesManager {
    public readonly cookiesDir: string;
    private currentCookieIndex = 1;
    private failedCookies = new Set<number>();
    private allCookiesFailed = false;

    public constructor(public readonly client: Rawon) {
        this.cookiesDir = path.resolve(process.cwd(), "cache", "cookies");
        this.ensureCookiesDir();
        this.initializeCurrentCookie();
    }

    private ensureCookiesDir(): void {
        if (!existsSync(this.cookiesDir)) {
            mkdirSync(this.cookiesDir, { recursive: true });
        }
    }

    private initializeCurrentCookie(): void {
        const cookies = this.listCookies();
        if (cookies.length > 0) {
            this.currentCookieIndex = cookies[0];
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
            return false;
        }

        this.failedCookies.add(this.currentCookieIndex);
        this.client.logger.warn(
            `[CookiesManager] Cookie ${this.currentCookieIndex} marked as failed. Failed cookies: ${Array.from(this.failedCookies).join(", ")}`,
        );

        for (const index of cookies) {
            if (!this.failedCookies.has(index)) {
                this.currentCookieIndex = index;
                this.client.logger.info(
                    `[CookiesManager] Rotated to cookie ${this.currentCookieIndex}`,
                );
                return true;
            }
        }

        this.allCookiesFailed = true;
        this.client.logger.error(
            "[CookiesManager] All cookies have failed. Please add new cookies.",
        );
        return false;
    }

    public resetFailedStatus(): void {
        this.failedCookies.clear();
        this.allCookiesFailed = false;
        this.initializeCurrentCookie();
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

            if (this.allCookiesFailed) {
                this.allCookiesFailed = false;
                this.currentCookieIndex = index;
            }

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

                if (this.currentCookieIndex === index) {
                    this.initializeCurrentCookie();
                }

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
        this.allCookiesFailed = false;
        this.currentCookieIndex = 1;

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
}
