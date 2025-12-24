import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import http from "node:http";
import path from "node:path";
import process from "node:process";
import { setTimeout } from "node:timers";

const COOKIES_DIR = path.resolve(process.cwd(), "cache");
const COOKIES_FILE = path.resolve(COOKIES_DIR, "cookies.txt");
const SESSION_FILE = path.resolve(COOKIES_DIR, "youtube-session.json");
const BROWSER_DATA_DIR = path.resolve(COOKIES_DIR, "browser-data");

// Safe URL hostname checking to avoid substring attacks
function isYouTubeUrl(urlString: string): boolean {
    try {
        const url = new URL(urlString);
        return (
            url.hostname === "youtube.com" ||
            url.hostname === "www.youtube.com" ||
            url.hostname === "music.youtube.com" ||
            url.hostname.endsWith(".youtube.com")
        );
    } catch {
        return false;
    }
}

function isGoogleLoginUrl(urlString: string): boolean {
    try {
        const url = new URL(urlString);
        return (
            url.hostname === "accounts.google.com" || url.hostname.endsWith(".accounts.google.com")
        );
    } catch {
        return false;
    }
}

function isYouTubeOrGoogleDomain(domain: string): boolean {
    const normalizedDomain = domain.startsWith(".") ? domain.slice(1) : domain;
    return (
        normalizedDomain === "youtube.com" ||
        normalizedDomain.endsWith(".youtube.com") ||
        normalizedDomain === "google.com" ||
        normalizedDomain.endsWith(".google.com")
    );
}

export interface YouTubeSession {
    cookies: string;
    lastUpdated: number;
    email?: string;
}

export interface BrowserLoginResult {
    success: boolean;
    error?: string;
    cookies?: string;
}

export interface LoginSession {
    browser: import("puppeteer").Browser | null;
    page: import("puppeteer").Page | null;
    debugUrl: string | null;
    server: http.Server | null;
    startTime: number;
    isActive: boolean;
}

/**
 * Manages YouTube cookies extracted from browser sessions
 */
export class YouTubeCookieManager {
    private session: YouTubeSession | null = null;
    private loginSession: LoginSession = {
        browser: null,
        page: null,
        debugUrl: null,
        server: null,
        startTime: 0,
        isActive: false,
    };

    public constructor() {
        this.ensureDirectory();
        this.loadSession();
    }

    private ensureDirectory(): void {
        if (!existsSync(COOKIES_DIR)) {
            mkdirSync(COOKIES_DIR, { recursive: true });
        }
        if (!existsSync(BROWSER_DATA_DIR)) {
            mkdirSync(BROWSER_DATA_DIR, { recursive: true });
        }
    }

    private loadSession(): void {
        try {
            if (existsSync(SESSION_FILE)) {
                const content = readFileSync(SESSION_FILE, "utf8");
                this.session = JSON.parse(content) as YouTubeSession;
            }
        } catch (error) {
            console.error("[YouTubeCookieManager] Failed to load session:", error);
        }
    }

    private saveSession(): void {
        if (!this.session) {
            return;
        }
        writeFileSync(SESSION_FILE, JSON.stringify(this.session, null, 2));
    }

    public get isConfigured(): boolean {
        return this.session !== null && this.session.cookies.length > 0;
    }

    public get cookiesPath(): string {
        return COOKIES_FILE;
    }

    public get hasCookiesFile(): boolean {
        return existsSync(COOKIES_FILE);
    }

    public get hasActiveLoginSession(): boolean {
        return this.loginSession.isActive;
    }

    public get loginDebugUrl(): string | null {
        return this.loginSession.debugUrl;
    }

    /**
     * Start a browser login session with remote debugging
     * User can connect to the debug URL to complete login
     */
    public async startLoginSession(
        debugPort = 9222,
        instructionsPort = 9223,
    ): Promise<{
        success: boolean;
        debugUrl?: string;
        error?: string;
    }> {
        if (this.loginSession.isActive) {
            return {
                success: false,
                error: "A login session is already active. Use cancelLoginSession() to cancel it first.",
            };
        }

        // Dynamic import to avoid loading puppeteer when not needed
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let puppeteerModule: any;
        try {
            puppeteerModule = await import("puppeteer");
        } catch {
            return {
                success: false,
                error: "Puppeteer is not installed. Make sure to install puppeteer and have Chromium available.",
            };
        }

        console.info("[YouTubeCookieManager] Starting browser login session...");

        try {
            // Check for chromium executable path from env
            const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;

            // Launch browser with remote debugging
            // Using headless: false to avoid Google's headless browser detection
            const browser = await puppeteerModule.default.launch({
                headless: false, // Must be false to bypass Google's "This browser or app may not be secure" error
                executablePath: executablePath || undefined,
                args: [
                    "--no-sandbox",
                    "--disable-setuid-sandbox",
                    "--disable-dev-shm-usage",
                    `--remote-debugging-port=${debugPort}`,
                    "--remote-debugging-address=0.0.0.0",
                    "--disable-gpu",
                    "--window-size=1280,720",
                    // Anti-detection flags
                    "--disable-blink-features=AutomationControlled",
                    "--disable-infobars",
                    "--start-maximized",
                    "--no-first-run",
                    "--no-default-browser-check",
                    "--disable-popup-blocking",
                    // Make browser appear more like a regular browser
                    "--lang=en-US,en",
                ],
                userDataDir: BROWSER_DATA_DIR,
                ignoreDefaultArgs: ["--enable-automation"], // Remove automation flag
            });

            const page = await browser.newPage();

            // Set viewport size
            await page.setViewport({ width: 1280, height: 720 });

            // Set user agent to look like a real browser
            await page.setUserAgent(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            );

            // Remove webdriver property to avoid detection
            await page.evaluateOnNewDocument(() => {
                // Remove webdriver property
                Object.defineProperty(navigator, "webdriver", {
                    get: () => undefined,
                });
                // Fake plugins
                Object.defineProperty(navigator, "plugins", {
                    get: () => [1, 2, 3, 4, 5],
                });
                // Fake languages
                Object.defineProperty(navigator, "languages", {
                    get: () => ["en-US", "en"],
                });
            });

            // Navigate to Google login for YouTube
            await page.goto(
                "https://accounts.google.com/ServiceLogin?service=youtube&continue=https://www.youtube.com",
                {
                    waitUntil: "networkidle2",
                    timeout: 60000,
                },
            );

            // Get the WebSocket debug URL
            const wsEndpoint = browser.wsEndpoint();

            // Create a simple HTTP server to show instructions
            const server = http.createServer((_req, res) => {
                res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
                res.end(`
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <title>Rawon YouTube Login</title>
                        <style>
                            body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
                            .warning { background: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 5px; margin: 20px 0; }
                            .info { background: #d1ecf1; border: 1px solid #17a2b8; padding: 15px; border-radius: 5px; margin: 20px 0; }
                            code { background: #f4f4f4; padding: 2px 6px; border-radius: 3px; }
                            h1 { color: #333; }
                        </style>
                    </head>
                    <body>
                        <h1>🍜 Rawon YouTube Login</h1>
                        <div class="warning">
                            <strong>⚠️ Security Warning:</strong> Use a throwaway/secondary Google account, NOT your main account!
                        </div>
                        <div class="info">
                            <h3>Instructions:</h3>
                            <ol>
                                <li>Open Chrome/Chromium browser on your computer</li>
                                <li>Go to: <code>chrome://inspect</code></li>
                                <li>Click "Configure" and add: <code>${process.env.PUBLIC_HOST || "your-server-ip"}:${debugPort}</code></li>
                                <li>Click "inspect" under the Remote Target</li>
                                <li>Complete the Google login in the opened window</li>
                                <li>Once you see YouTube homepage, run <code>!ytcookies save</code> in Discord</li>
                            </ol>
                        </div>
                        <div class="info">
                            <strong>WebSocket Endpoint:</strong> <code>${wsEndpoint}</code>
                        </div>
                    </body>
                    </html>
                `);
            });

            server.listen(instructionsPort);

            this.loginSession = {
                browser,
                page,
                debugUrl: `http://${process.env.PUBLIC_HOST || "localhost"}:${instructionsPort}`,
                server,
                startTime: Date.now(),
                isActive: true,
            };

            // Start monitoring for login completion
            this.monitorLoginCompletion();

            return {
                success: true,
                debugUrl: this.loginSession.debugUrl ?? undefined,
            };
        } catch (error) {
            console.error("[YouTubeCookieManager] Failed to start login session:", error);
            return {
                success: false,
                error: (error as Error).message,
            };
        }
    }

    /**
     * Monitor the browser for login completion
     */
    private async monitorLoginCompletion(): Promise<void> {
        if (!this.loginSession.page) {
            return;
        }

        const maxWaitTime = 10 * 60 * 1000; // 10 minutes
        const checkInterval = 3000; // Check every 3 seconds

        const checkLogin = async (): Promise<void> => {
            if (!this.loginSession.isActive || !this.loginSession.page) {
                return;
            }

            const elapsed = Date.now() - this.loginSession.startTime;
            if (elapsed > maxWaitTime) {
                console.info("[YouTubeCookieManager] Login session timed out");
                await this.cancelLoginSession();
                return;
            }

            try {
                const url = this.loginSession.page.url();

                // Check if we're on YouTube (login successful) using proper hostname check
                if (isYouTubeUrl(url) && !isGoogleLoginUrl(url)) {
                    console.info("[YouTubeCookieManager] Login detected! Ready to save cookies.");
                    // Don't auto-save, let user trigger it
                }
            } catch {
                // Page might be closed, ignore
            }

            // Schedule next check
            setTimeout(checkLogin, checkInterval);
        };

        setTimeout(checkLogin, checkInterval);
    }

    /**
     * Save cookies from the active login session
     */
    public async saveLoginSessionCookies(): Promise<BrowserLoginResult> {
        if (!this.loginSession.isActive || !this.loginSession.page) {
            return {
                success: false,
                error: "No active login session. Start one with startLoginSession() first.",
            };
        }

        try {
            const url = this.loginSession.page.url();

            // Use proper hostname check to avoid URL substring attacks
            if (!isYouTubeUrl(url) || isGoogleLoginUrl(url)) {
                return {
                    success: false,
                    error: "Please complete the Google login first. The browser should be on youtube.com",
                };
            }

            // Extract cookies
            const cookies = await this.loginSession.page.cookies();
            const cookiesStr = this.convertToNetscapeFormat(cookies);

            if (!cookiesStr || cookiesStr.split("\n").length < 5) {
                return {
                    success: false,
                    error: "No valid cookies found. Please make sure you're logged in.",
                };
            }

            // Save cookies
            this.saveCookies(cookiesStr);

            // Close the session
            await this.cancelLoginSession();

            console.info("[YouTubeCookieManager] Successfully saved cookies!");
            return { success: true, cookies: cookiesStr };
        } catch (error) {
            console.error("[YouTubeCookieManager] Failed to save cookies:", error);
            return { success: false, error: (error as Error).message };
        }
    }

    /**
     * Cancel the active login session
     */
    public async cancelLoginSession(): Promise<void> {
        if (this.loginSession.browser) {
            try {
                await this.loginSession.browser.close();
            } catch (error) {
                // Log but don't throw - browser may already be closed
                console.warn("[YouTubeCookieManager] Failed to close browser:", error);
            }
        }

        if (this.loginSession.server) {
            this.loginSession.server.close();
        }

        this.loginSession = {
            browser: null,
            page: null,
            debugUrl: null,
            server: null,
            startTime: 0,
            isActive: false,
        };
    }

    /**
     * Convert Puppeteer cookies to Netscape format for yt-dlp
     */
    private convertToNetscapeFormat(
        cookies: Array<{
            name: string;
            value: string;
            domain: string;
            path: string;
            expires?: number;
            httpOnly?: boolean;
            secure?: boolean;
        }>,
    ): string {
        const lines = [
            "# Netscape HTTP Cookie File",
            "# https://curl.se/docs/http-cookies.html",
            "# This file was generated by Rawon Discord Bot",
            "",
        ];

        for (const cookie of cookies) {
            // Filter only YouTube/Google related cookies using proper domain check
            if (!isYouTubeOrGoogleDomain(cookie.domain)) {
                continue;
            }

            const domain = cookie.domain.startsWith(".") ? cookie.domain : `.${cookie.domain}`;
            const includeSubdomains = domain.startsWith(".") ? "TRUE" : "FALSE";
            const secure = cookie.secure ? "TRUE" : "FALSE";
            const expiry =
                !cookie.expires || cookie.expires === -1
                    ? "0"
                    : Math.floor(cookie.expires).toString();

            lines.push(
                `${domain}\t${includeSubdomains}\t${cookie.path}\t${secure}\t${expiry}\t${cookie.name}\t${cookie.value}`,
            );
        }

        return lines.join("\n");
    }

    /**
     * Save cookies to file and session
     */
    private saveCookies(cookiesStr: string): void {
        // Save to Netscape format file for yt-dlp
        writeFileSync(COOKIES_FILE, cookiesStr);

        // Save session
        this.session = {
            cookies: cookiesStr,
            lastUpdated: Date.now(),
        };
        this.saveSession();
    }

    /**
     * Clear all stored cookies and session
     */
    public clearCookies(): void {
        this.session = null;

        try {
            if (existsSync(SESSION_FILE)) {
                unlinkSync(SESSION_FILE);
            }
            if (existsSync(COOKIES_FILE)) {
                unlinkSync(COOKIES_FILE);
            }
        } catch {
            // Ignore cleanup errors
        }
    }

    /**
     * Get session info
     */
    public getSessionInfo(): {
        isConfigured: boolean;
        lastUpdated: number | null;
        cookiesFileExists: boolean;
    } {
        return {
            isConfigured: this.isConfigured,
            lastUpdated: this.session?.lastUpdated ?? null,
            cookiesFileExists: this.hasCookiesFile,
        };
    }
}

// Singleton instance
export const youtubeCookieManager = new YouTubeCookieManager();
