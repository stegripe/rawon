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

    /**
     * Get the path for a cookie file by its index
     */
    public getCookiePath(index: number): string {
        return path.join(this.cookiesDir, `cookies-${index}.txt`);
    }

    /**
     * Get the current active cookie path, or null if all cookies have failed
     */
    public getCurrentCookiePath(): string | null {
        if (this.allCookiesFailed) {
            return null;
        }

        const cookies = this.listCookies();
        if (cookies.length === 0) {
            return null;
        }

        // If current cookie exists and hasn't failed, use it
        const cookiePath = this.getCookiePath(this.currentCookieIndex);
        if (existsSync(cookiePath) && !this.failedCookies.has(this.currentCookieIndex)) {
            return cookiePath;
        }

        // Try to find a working cookie
        for (const index of cookies) {
            if (!this.failedCookies.has(index)) {
                this.currentCookieIndex = index;
                return this.getCookiePath(index);
            }
        }

        // All cookies have failed
        this.allCookiesFailed = true;
        return null;
    }

    /**
     * Mark the current cookie as failed and rotate to the next one
     * Returns true if rotation was successful, false if all cookies have failed
     */
    public rotateOnFailure(): boolean {
        const cookies = this.listCookies();
        if (cookies.length === 0) {
            this.allCookiesFailed = true;
            return false;
        }

        // Mark current cookie as failed
        this.failedCookies.add(this.currentCookieIndex);
        this.client.logger.warn(
            `[CookiesManager] Cookie ${this.currentCookieIndex} marked as failed. Failed cookies: ${Array.from(this.failedCookies).join(", ")}`,
        );

        // Find next working cookie
        for (const index of cookies) {
            if (!this.failedCookies.has(index)) {
                this.currentCookieIndex = index;
                this.client.logger.info(
                    `[CookiesManager] Rotated to cookie ${this.currentCookieIndex}`,
                );
                return true;
            }
        }

        // All cookies have failed
        this.allCookiesFailed = true;
        this.client.logger.error(
            "[CookiesManager] All cookies have failed. Please add new cookies.",
        );
        return false;
    }

    /**
     * Reset all failed cookies status (useful after adding new cookies)
     */
    public resetFailedStatus(): void {
        this.failedCookies.clear();
        this.allCookiesFailed = false;
        this.initializeCurrentCookie();
        this.client.logger.info("[CookiesManager] Reset all failed cookie statuses.");
    }

    /**
     * Check if all cookies have failed
     */
    public areAllCookiesFailed(): boolean {
        return this.allCookiesFailed;
    }

    /**
     * List all available cookie indices
     */
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

    /**
     * Add a cookie file with the specified index
     * Returns "added" for new cookies, "replaced" if cookie already existed, or false on error
     */
    public addCookie(index: number, content: string): "added" | "replaced" | false {
        try {
            const cookiePath = this.getCookiePath(index);
            const existed = existsSync(cookiePath);
            writeFileSync(cookiePath, content, "utf8");

            // Remove the failed status for this specific cookie
            this.failedCookies.delete(index);

            // Reset the allCookiesFailed flag if it was set, but don't reset other failed cookies
            if (this.allCookiesFailed) {
                this.allCookiesFailed = false;
                // Set this new cookie as the current one
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

    /**
     * Remove a cookie file by index
     */
    public removeCookie(index: number): boolean {
        try {
            const cookiePath = this.getCookiePath(index);
            if (existsSync(cookiePath)) {
                rmSync(cookiePath, { force: true });
                this.failedCookies.delete(index);

                // If we removed the current cookie, switch to another
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

    /**
     * Remove all cookie files
     */
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

    /**
     * Get cookie status for display
     */
    public getCookieStatus(index: number): "active" | "failed" | "available" {
        if (this.currentCookieIndex === index && !this.failedCookies.has(index)) {
            return "active";
        }
        if (this.failedCookies.has(index)) {
            return "failed";
        }
        return "available";
    }

    /**
     * Get current cookie index
     */
    public getCurrentCookieIndex(): number {
        return this.currentCookieIndex;
    }

    /**
     * Get count of cookies
     */
    public getCookieCount(): number {
        return this.listCookies().length;
    }

    /**
     * Get count of failed cookies
     */
    public getFailedCookieCount(): number {
        return this.failedCookies.size;
    }

    /**
     * Get cookie file content by index
     * Returns the content as string or null if not found
     */
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
