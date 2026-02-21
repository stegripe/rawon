import { type ChildProcess, execSync } from "node:child_process";
import {
    existsSync,
    mkdirSync,
    readdirSync,
    readFileSync,
    rmSync,
    unlinkSync,
    writeFileSync,
} from "node:fs";
import { createConnection, createServer, type Server } from "node:net";
import path from "node:path";
import process from "node:process";
import { clearInterval, clearTimeout, setInterval, setTimeout } from "node:timers";
import {
    Browser as BrowserProduct,
    BrowserTag,
    ChromeReleaseChannel,
    computeExecutablePath,
    computeSystemExecutablePath,
    detectBrowserPlatform,
    install,
    resolveBuildId,
} from "@puppeteer/browsers";
import { container } from "@sapphire/framework";
import Database from "better-sqlite3";
import puppeteer, { type Browser, type Cookie, type Page, type Target } from "puppeteer-core";

export type LoginStatus = "idle" | "waiting_for_login" | "logged_in" | "error";

const CHROME_USER_AGENT =
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36";

export interface LoginSessionInfo {
    status: LoginStatus;
    debugUrl: string | null;
    inspectUrl: string | null;
    loginUrl: string | null;
    email: string | null;
    lastCookieRefresh: number | null;
    error: string | null;
}

interface BrowserPaths {
    userDataDir: string;
    cookiesFilePath: string;
    dbPath: string;
}

const YOUTUBE_DOMAINS = [
    ".youtube.com",
    ".google.com",
    ".googlevideo.com",
    ".googleapis.com",
    ".accounts.google.com",
    ".youtu.be",
];

const LOGIN_CHECK_INTERVAL_MS = 5_000;
const LOGIN_TIMEOUT_MS = 5 * 60 * 1000;

const PAGE_NAVIGATION_TIMEOUT_MS = 60_000;

/** Poll interval & max wait for SSO cookies after navigating to YouTube. */
const LOGIN_SSO_POLL_MS = 2_000;
const LOGIN_SSO_MAX_WAIT_MS = 10_000;

/** Retries for extractAccountName when page may still be loading. */
const EXTRACT_ACCOUNT_RETRIES = 2;
const EXTRACT_ACCOUNT_RETRY_DELAY_MS = 2_000;

const CRITICAL_YOUTUBE_COOKIES = ["LOGIN_INFO", "SID", "HSID", "SSID", "APISID", "SAPISID"];

export class GoogleLoginManager {
    private browser: Browser | null = null;
    private page: Page | null = null;
    private status: LoginStatus = "idle";
    private debugUrl: string | null = null;
    private inspectUrl: string | null = null;
    private loginEmail: string | null = null;
    private lastCookieRefresh: number | null = null;
    private error: string | null = null;
    private loginCheckInterval: ReturnType<typeof setInterval> | null = null;
    private loginTimeout: ReturnType<typeof setTimeout> | null = null;

    private readonly paths: BrowserPaths;
    private readonly chromiumPath: string | null;
    private readonly devtoolsPort: number;
    private readonly db: Database.Database;
    private actualPort: number | null = null;
    private chromeProcess: ChildProcess | null = null;
    private loginTargetId: string | null = null;
    private browserWSEndpoint: string | null = null;
    private currentLoginUrl: string | null = null;
    private proxyServer: Server | null = null;
    private visitorData: string | null = null;

    public constructor(chromiumPath?: string, devtoolsPort = 3000) {
        const cacheDir = path.resolve(process.cwd(), "cache");

        this.paths = {
            userDataDir: path.resolve(cacheDir, "cookies", "browser-profile"),
            cookiesFilePath: path.resolve(cacheDir, "cookies", "cookies.txt"),
            dbPath: path.resolve(cacheDir, "data.db"),
        };

        this.chromiumPath = chromiumPath ?? null;
        this.devtoolsPort = devtoolsPort;

        this.ensureDirectories();
        this.db = new Database(this.paths.dbPath);
        this.db.pragma("journal_mode = WAL");
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS login_session (
                id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
                was_running INTEGER NOT NULL DEFAULT 0,
                email TEXT,
                visitor_data TEXT,
                saved_at INTEGER NOT NULL
            )
        `);

        try {
            this.db.exec("ALTER TABLE login_session ADD COLUMN visitor_data TEXT");
        } catch {}
    }

    private ensureDirectories(): void {
        for (const dir of [this.paths.userDataDir, path.dirname(this.paths.cookiesFilePath)]) {
            if (!existsSync(dir)) {
                mkdirSync(dir, { recursive: true });
            }
        }
    }

    private cleanProfileLocks(): void {
        const lockFiles = ["SingletonLock", "SingletonCookie", "SingletonSocket"];
        for (const lockFile of lockFiles) {
            const lockPath = path.join(this.paths.userDataDir, lockFile);
            try {
                unlinkSync(lockPath);
                container.logger.debug(`[GoogleLogin] Removed stale lock file: ${lockFile}`);
            } catch {}
        }
    }

    private async applyStealthToPage(page: Page): Promise<void> {
        try {
            await page.evaluateOnNewDocument(() => {
                Object.defineProperty(navigator, "webdriver", {
                    get: () => undefined,
                });
            });

            await page.evaluateOnNewDocument(() => {
                // @ts-expect-error - adding chrome object for stealth
                window.chrome = {
                    runtime: {
                        onConnect: {
                            addListener: () => undefined,
                        },
                        onMessage: {
                            addListener: () => undefined,
                        },
                        connect: () => ({
                            onDisconnect: {
                                addListener: () => undefined,
                            },
                        }),
                        sendMessage: () => undefined,
                    },
                    csi: () => ({}),
                    loadTimes: () => ({}),
                    app: {
                        isInstalled: false,
                        InstallState: { INSTALLED: "installed", NOT_INSTALLED: "not_installed" },
                        RunningState: {
                            CANNOT_RUN: "cannot_run",
                            READY_TO_RUN: "ready_to_run",
                            RUNNING: "running",
                        },
                        getDetails: () => null,
                        getIsInstalled: () => false,
                    },
                };
            });

            await page.evaluateOnNewDocument(`
                (() => {
                    const originalQuery = window.navigator.permissions.query.bind(window.navigator.permissions);
                    window.navigator.permissions.query = (parameters) =>
                        parameters.name === "notifications"
                            ? Promise.resolve({ state: Notification.permission })
                            : originalQuery(parameters);
                })()
            `);

            await page.evaluateOnNewDocument(() => {
                Object.defineProperty(navigator, "plugins", {
                    get: () => [
                        { name: "Chrome PDF Plugin", filename: "internal-pdf-viewer" },
                        { name: "Chrome PDF Viewer", filename: "mhjfbmdgcfjbbpaeojofohoefgiehjai" },
                        { name: "Native Client", filename: "internal-nacl-plugin" },
                    ],
                });
            });

            await page.evaluateOnNewDocument(() => {
                Object.defineProperty(navigator, "languages", {
                    get: () => ["en-US", "en"],
                });
            });

            await page.evaluateOnNewDocument(`
                (() => {
                    const originalAttachShadow = Element.prototype.attachShadow;
                    Element.prototype.attachShadow = function(init) {
                        return originalAttachShadow.call(this, init);
                    };
                })()
            `);

            const cdpSession = await page.createCDPSession();
            await cdpSession.send("Network.setUserAgentOverride", {
                userAgent: CHROME_USER_AGENT,
            });

            await page.setExtraHTTPHeaders({
                "Accept-Language": "en-US,en;q=0.9",
            });
        } catch {}
    }

    public getSessionInfo(): LoginSessionInfo {
        return {
            status: this.status,
            debugUrl: this.debugUrl,
            inspectUrl: this.inspectUrl,
            loginUrl: this.currentLoginUrl ?? this.page?.url() ?? null,
            email: this.loginEmail,
            lastCookieRefresh: this.lastCookieRefresh,
            error: this.error,
        };
    }

    public getCookiesFilePath(): string {
        return this.paths.cookiesFilePath;
    }

    public hasCookies(): boolean {
        return existsSync(this.paths.cookiesFilePath);
    }

    public isLoggedIn(): boolean {
        return this.status === "logged_in";
    }

    public isBrowserRunning(): boolean {
        return (
            (this.chromeProcess !== null && !this.chromeProcess.killed) ||
            (this.browser?.connected ?? false)
        );
    }

    private async findBrowserPath(): Promise<string> {
        if (this.chromiumPath) {
            if (existsSync(this.chromiumPath)) {
                return this.chromiumPath;
            }
            container.logger.warn(
                `[GoogleLogin] CHROMIUM_PATH "${this.chromiumPath}" does not exist, searching...`,
            );
        }

        for (const channel of [
            ChromeReleaseChannel.STABLE,
            ChromeReleaseChannel.BETA,
            ChromeReleaseChannel.DEV,
            ChromeReleaseChannel.CANARY,
        ]) {
            try {
                const sysPath = computeSystemExecutablePath({
                    browser: BrowserProduct.CHROME,
                    channel,
                });
                if (sysPath && existsSync(sysPath)) {
                    container.logger.debug(
                        `[GoogleLogin] Found system Chrome (${channel}): ${sysPath}`,
                    );
                    return sysPath;
                }
            } catch {}
        }

        const candidates = this.getCandidatePaths();

        for (const candidate of candidates) {
            if (candidate && existsSync(candidate)) {
                container.logger.debug(`[GoogleLogin] Found browser at: ${candidate}`);
                return candidate;
            }
        }

        const foundInPath = this.findBrowserInPath();
        if (foundInPath) {
            container.logger.debug(`[GoogleLogin] Found browser in PATH: ${foundInPath}`);
            return foundInPath;
        }

        try {
            const puppeteerFull = await import("puppeteer");
            const execPath = puppeteerFull.executablePath();
            if (execPath && existsSync(execPath)) {
                container.logger.debug(
                    `[GoogleLogin] Using puppeteer bundled browser: ${execPath}`,
                );
                return execPath;
            }
        } catch {}

        const downloadDir = path.resolve(process.cwd(), "cache", "scripts", "chrome");
        const existingPath = this.findDownloadedBrowser(downloadDir);
        if (existingPath) {
            container.logger.debug(
                `[GoogleLogin] Using previously downloaded Chrome: ${existingPath}`,
            );
            return existingPath;
        }

        container.logger.info(
            "[GoogleLogin] No Chrome/Chromium found. Auto-downloading Chrome for Testing...",
        );
        return this.downloadBrowser(downloadDir);
    }

    private getCandidatePaths(): string[] {
        const candidates: string[] = [];
        const env = process.env;

        if (process.platform === "win32") {
            const programFiles = env.PROGRAMFILES ?? "C:\\Program Files";
            const programFilesX86 = env["PROGRAMFILES(X86)"] ?? "C:\\Program Files (x86)";
            const localAppData = env.LOCALAPPDATA ?? "";
            const appData = env.APPDATA ?? "";
            const userProfile = env.USERPROFILE ?? "";

            for (const base of [programFiles, programFilesX86, localAppData]) {
                candidates.push(`${base}\\Google\\Chrome\\Application\\chrome.exe`);
            }

            candidates.push(
                `${localAppData}\\Google\\Chrome Beta\\Application\\chrome.exe`,
                `${localAppData}\\Google\\Chrome Dev\\Application\\chrome.exe`,
                `${localAppData}\\Google\\Chrome SxS\\Application\\chrome.exe`,
                `${programFiles}\\Google\\Chrome Beta\\Application\\chrome.exe`,
                `${programFiles}\\Google\\Chrome Dev\\Application\\chrome.exe`,
            );

            for (const base of [programFiles, programFilesX86, localAppData]) {
                candidates.push(`${base}\\Chromium\\Application\\chrome.exe`);
            }

            for (const base of [programFiles, programFilesX86]) {
                candidates.push(`${base}\\Microsoft\\Edge\\Application\\msedge.exe`);
            }
            candidates.push(`${localAppData}\\Microsoft\\Edge\\Application\\msedge.exe`);

            candidates.push(
                `${localAppData}\\Microsoft\\Edge Beta\\Application\\msedge.exe`,
                `${localAppData}\\Microsoft\\Edge Dev\\Application\\msedge.exe`,
                `${localAppData}\\Microsoft\\Edge SxS\\Application\\msedge.exe`,
            );

            for (const base of [programFiles, programFilesX86, localAppData]) {
                candidates.push(`${base}\\BraveSoftware\\Brave-Browser\\Application\\brave.exe`);
            }

            candidates.push(`${localAppData}\\Vivaldi\\Application\\vivaldi.exe`);

            candidates.push(
                `${localAppData}\\Programs\\Opera\\opera.exe`,
                `${appData}\\Opera Software\\Opera Stable\\opera.exe`,
            );

            candidates.push(
                `${userProfile}\\scoop\\apps\\googlechrome\\current\\chrome.exe`,
                `${userProfile}\\scoop\\apps\\chromium\\current\\chrome.exe`,
                "C:\\tools\\Chrome\\Application\\chrome.exe",
            );
        } else if (process.platform === "darwin") {
            const home = env.HOME ?? "";

            candidates.push(
                "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
                `${home}/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`,
            );

            candidates.push(
                "/Applications/Google Chrome Beta.app/Contents/MacOS/Google Chrome Beta",
                "/Applications/Google Chrome Dev.app/Contents/MacOS/Google Chrome Dev",
                "/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary",
                `${home}/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary`,
            );

            candidates.push(
                "/Applications/Chromium.app/Contents/MacOS/Chromium",
                `${home}/Applications/Chromium.app/Contents/MacOS/Chromium`,
            );

            candidates.push(
                "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
                `${home}/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge`,
            );

            candidates.push(
                "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
                `${home}/Applications/Brave Browser.app/Contents/MacOS/Brave Browser`,
            );

            candidates.push("/Applications/Vivaldi.app/Contents/MacOS/Vivaldi");

            candidates.push("/Applications/Arc.app/Contents/MacOS/Arc");

            candidates.push("/opt/homebrew/bin/chromium", "/usr/local/bin/chromium");
        } else {
            const home = env.HOME ?? "";

            candidates.push(
                "/usr/bin/google-chrome",
                "/usr/bin/google-chrome-stable",
                "/usr/bin/google-chrome-beta",
                "/usr/bin/google-chrome-unstable",
                "/usr/bin/chromium",
                "/usr/bin/chromium-browser",
                "/usr/bin/chrome",
            );

            candidates.push(
                "/usr/local/bin/google-chrome",
                "/usr/local/bin/google-chrome-stable",
                "/usr/local/bin/chromium",
                "/usr/local/bin/chromium-browser",
                "/usr/local/bin/chrome",
            );

            candidates.push(
                "/usr/lib/chromium/chromium",
                "/usr/lib/chromium-browser/chromium-browser",
                "/usr/lib64/chromium-browser/chromium-browser",
                "/usr/lib/google-chrome/google-chrome",
            );

            candidates.push(
                "/opt/google/chrome/chrome",
                "/opt/google/chrome/google-chrome",
                "/opt/google/chrome-beta/chrome",
                "/opt/google/chrome-unstable/chrome",
                "/opt/chromium/chrome",
                "/opt/chromium-browser/chromium-browser",
            );

            candidates.push(
                "/snap/bin/chromium",
                "/snap/chromium/current/usr/lib/chromium-browser/chrome",
            );

            candidates.push(
                "/var/lib/flatpak/exports/bin/com.google.Chrome",
                "/var/lib/flatpak/exports/bin/org.chromium.Chromium",
                `${home}/.local/share/flatpak/exports/bin/com.google.Chrome`,
                `${home}/.local/share/flatpak/exports/bin/org.chromium.Chromium`,
            );

            candidates.push(
                `${home}/.nix-profile/bin/google-chrome-stable`,
                `${home}/.nix-profile/bin/chromium`,
                "/run/current-system/sw/bin/google-chrome-stable",
                "/run/current-system/sw/bin/chromium",
            );

            candidates.push(`${home}/Applications/chrome`, `${home}/Applications/chromium`);

            candidates.push(
                "/usr/bin/microsoft-edge",
                "/usr/bin/microsoft-edge-stable",
                "/usr/bin/microsoft-edge-beta",
                "/usr/bin/microsoft-edge-dev",
                "/opt/microsoft/msedge/msedge",
            );

            candidates.push(
                "/usr/bin/brave-browser",
                "/usr/bin/brave-browser-stable",
                "/opt/brave.com/brave/brave-browser",
            );

            candidates.push("/usr/bin/vivaldi", "/usr/bin/vivaldi-stable");
        }

        return candidates;
    }

    private findBrowserInPath(): string | null {
        const names =
            process.platform === "win32"
                ? ["chrome.exe", "msedge.exe", "brave.exe", "vivaldi.exe", "chromium.exe"]
                : [
                      "google-chrome",
                      "google-chrome-stable",
                      "chromium",
                      "chromium-browser",
                      "chrome",
                      "microsoft-edge",
                      "brave-browser",
                      "vivaldi",
                  ];

        const whichCmd = process.platform === "win32" ? "where" : "which";

        for (const name of names) {
            try {
                const result = execSync(`${whichCmd} ${name}`, {
                    encoding: "utf8",
                    stdio: ["pipe", "pipe", "pipe"],
                    timeout: 5_000,
                }).trim();

                const firstLine = result.split("\n")[0]?.trim();
                if (firstLine && existsSync(firstLine)) {
                    return firstLine;
                }
            } catch {}
        }

        return null;
    }

    private findDownloadedBrowser(downloadDir: string): string | null {
        if (!existsSync(downloadDir)) {
            return null;
        }

        try {
            const platform = detectBrowserPlatform();
            if (!platform) {
                return null;
            }

            const entries = readdirSync(downloadDir, { withFileTypes: true });
            for (const entry of entries) {
                if (entry.isDirectory() && entry.name.startsWith("chrome")) {
                    const chromeDir = path.join(downloadDir, entry.name);
                    const buildEntries = readdirSync(chromeDir, { withFileTypes: true });
                    for (const buildEntry of buildEntries) {
                        if (buildEntry.isDirectory()) {
                            try {
                                const execPath = computeExecutablePath({
                                    browser: BrowserProduct.CHROME,
                                    buildId: buildEntry.name,
                                    cacheDir: downloadDir,
                                });
                                if (existsSync(execPath)) {
                                    return execPath;
                                }
                            } catch {}
                        }
                    }
                }
            }
        } catch {}

        return null;
    }

    private async downloadBrowser(downloadDir: string): Promise<string> {
        mkdirSync(downloadDir, { recursive: true });

        const platform = detectBrowserPlatform();
        if (!platform) {
            throw new Error(
                "Could not detect browser platform. Set CHROMIUM_PATH in env or install Chrome/Chromium manually.",
            );
        }

        const buildId = await resolveBuildId(BrowserProduct.CHROME, platform, BrowserTag.STABLE);

        container.logger.info(
            `[GoogleLogin] Downloading Chrome for Testing (${buildId}) for ${platform}...`,
        );

        const result = await install({
            browser: BrowserProduct.CHROME,
            buildId,
            cacheDir: downloadDir,
        });

        container.logger.info(
            `[GoogleLogin] Chrome for Testing downloaded to: ${result.executablePath}`,
        );

        return result.executablePath;
    }

    public async launchBrowser(forceHeadless = false): Promise<string> {
        if (this.browser?.connected) {
            this.debugUrl = this.getDevtoolsBaseUrl();
            return this.debugUrl;
        }

        const browserPath = await this.findBrowserPath();
        const port = this.devtoolsPort;
        const noDisplay = process.platform === "linux" && !process.env.DISPLAY;
        const useHeadless = forceHeadless || noDisplay;

        container.logger.info(
            `[GoogleLogin] Launching browser from: ${browserPath}${useHeadless ? " (headless)" : ""}`,
        );

        if (noDisplay && !forceHeadless) {
            container.logger.warn(
                "[GoogleLogin] No display found. Using headless mode with stealth evasions.",
            );
        }

        this.cleanProfileLocks();

        this.browser = await puppeteer.launch({
            executablePath: browserPath,
            headless: !!useHeadless,
            pipe: false,
            userDataDir: this.paths.userDataDir,
            args: [
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-dev-shm-usage",
                "--no-first-run",
                "--disable-background-networking",
                "--disable-default-apps",
                "--disable-sync",
                "--disable-translate",
                "--disable-blink-features=AutomationControlled",
                "--disable-features=Translate,AcceptCHFrame,MediaRouter,OptimizationHints",
                "--disable-component-extensions-with-background-pages",
                "--disable-ipc-flooding-protection",
                `--user-agent=${CHROME_USER_AGENT}`,
                "--window-size=1280,720",
                "--remote-allow-origins=*",
            ],
            defaultViewport: { width: 1280, height: 720 },
        });

        this.browser.on("targetcreated", async (target: Target) => {
            const page = await target.page();
            if (page) {
                await this.applyStealthToPage(page);
            }
        });

        const pages = await this.browser.pages();
        for (const page of pages) {
            await this.applyStealthToPage(page);
        }

        this.chromeProcess = this.browser.process() ?? null;
        this.browserWSEndpoint = this.browser.wsEndpoint();

        const chromeDebugPort = this.extractPortFromWsEndpoint(this.browserWSEndpoint);
        await this.startDevtoolsProxy(port, chromeDebugPort);
        this.actualPort = port;
        this.debugUrl = this.getDevtoolsBaseUrl();

        this.browser.on("disconnected", () => {
            container.logger.warn("[GoogleLogin] Browser disconnected");
            this.chromeProcess = null;
            this.stopDevtoolsProxy();
            this.browser = null;
            this.page = null;
            this.debugUrl = null;
            this.inspectUrl = null;
            this.loginTargetId = null;
            this.currentLoginUrl = null;
            this.cleanupLoginWait();
        });

        this.inspectUrl = await this.buildInspectUrl();

        container.logger.info(
            `[GoogleLogin] Browser launched. DevTools: ${this.debugUrl}, Inspect URL: ${this.inspectUrl ?? "N/A"}`,
        );

        return this.debugUrl;
    }

    private extractPortFromWsEndpoint(wsEndpoint: string): number {
        try {
            const url = new URL(wsEndpoint);
            return Number(url.port);
        } catch {
            return this.devtoolsPort;
        }
    }

    private async startDevtoolsProxy(externalPort: number, chromePort: number): Promise<void> {
        this.stopDevtoolsProxy();

        if (externalPort === chromePort) {
            container.logger.info(
                `[GoogleLogin] Chrome already on port ${chromePort}, no proxy needed`,
            );
            return;
        }

        return new Promise((resolve, reject) => {
            this.proxyServer = createServer((clientSocket) => {
                const chromeSocket = createConnection(
                    { host: "127.0.0.1", port: chromePort },
                    () => {
                        clientSocket.pipe(chromeSocket);
                        chromeSocket.pipe(clientSocket);
                    },
                );

                chromeSocket.on("error", () => clientSocket.destroy());
                clientSocket.on("error", () => chromeSocket.destroy());
                chromeSocket.on("close", () => clientSocket.destroy());
                clientSocket.on("close", () => chromeSocket.destroy());
            });

            this.proxyServer.on("error", (err) => {
                container.logger.error(`[GoogleLogin] DevTools proxy error: ${err.message}`);
                reject(err);
            });

            this.proxyServer.listen(externalPort, "0.0.0.0", () => {
                container.logger.debug(
                    `[GoogleLogin] DevTools proxy: 0.0.0.0:${externalPort} → 127.0.0.1:${chromePort}`,
                );
                resolve();
            });
        });
    }

    private stopDevtoolsProxy(): void {
        if (this.proxyServer) {
            this.proxyServer.close();
            this.proxyServer = null;
        }
    }

    private async buildInspectUrl(): Promise<string | null> {
        const host = "127.0.0.1";
        const port = this.actualPort ?? this.devtoolsPort;

        for (let attempt = 0; attempt < 3; attempt++) {
            try {
                const response = await fetch(`http://${host}:${port}/json`);
                const pages = (await response.json()) as Array<{
                    devtoolsFrontendUrl?: string;
                    webSocketDebuggerUrl?: string;
                    id?: string;
                }>;

                if (pages.length > 0 && pages[0].id) {
                    return `http://${host}:${port}/devtools/inspector.html?ws=${host}:${port}/devtools/page/${pages[0].id}`;
                }
            } catch {
                if (attempt < 2) {
                    await new Promise((resolve) => setTimeout(resolve, 500));
                }
            }
        }

        return null;
    }

    public getDevtoolsBaseUrl(): string {
        return `http://127.0.0.1:${this.actualPort ?? this.devtoolsPort}`;
    }

    public async startLoginSession(): Promise<boolean> {
        if (!this.browser?.connected) {
            await this.launchBrowser();
        }

        this.status = "waiting_for_login";
        this.error = null;

        try {
            await this.navigateToLoginPage();

            container.logger.info("[GoogleLogin] Login page opened. Waiting for user to log in...");

            const loggedIn = await this.waitForLogin();

            if (loggedIn) {
                const exportOk = await this.connectPuppeteerAndExportCookies();
                if (!exportOk) {
                    this.status = "error";
                    this.error =
                        "YouTube SSO or cookie export failed. Try again on a faster connection.";
                    container.logger.warn(
                        "[GoogleLogin] Cookie export/verify failed — possible slow network.",
                    );
                    await this.closeBrowserOnly();
                    return false;
                }

                await this.extractAccountName();

                this.status = "logged_in";
                this.saveSessionState();

                await this.closeBrowserOnly();

                container.logger.info(
                    `[GoogleLogin] Login successful! Account: ${this.loginEmail ?? "unknown"}. ` +
                        "Cookies exported to disk. Browser closed.",
                );

                return true;
            }

            this.status = "error";
            this.error = "Login timed out or was cancelled";
            container.logger.warn("[GoogleLogin] Login timed out or was cancelled");

            await this.closeBrowserOnly();

            return false;
        } catch (err) {
            this.status = "error";
            this.error = (err as Error).message;
            container.logger.error("[GoogleLogin] Login failed:", err);

            await this.closeBrowserOnly();

            return false;
        }
    }

    private async closeBrowserOnly(): Promise<void> {
        this.cleanupLoginWait();
        this.stopDevtoolsProxy();

        if (this.browser) {
            this.browser.removeAllListeners("disconnected");
            try {
                await this.browser.close();
            } catch {
                if (this.chromeProcess && !this.chromeProcess.killed) {
                    try {
                        this.chromeProcess.kill();
                    } catch {}
                }
            }
        } else if (this.chromeProcess && !this.chromeProcess.killed) {
            try {
                this.chromeProcess.kill();
            } catch {}
        }

        this.browser = null;
        this.page = null;
        this.chromeProcess = null;
        this.debugUrl = null;
        this.inspectUrl = null;
        this.loginTargetId = null;
        this.browserWSEndpoint = null;
        this.currentLoginUrl = null;

        container.logger.info("[GoogleLogin] Browser closed. Cookies remain on disk.");
    }

    private async navigateToLoginPage(): Promise<void> {
        const port = this.actualPort ?? this.devtoolsPort;
        const host = "127.0.0.1";
        const loginUrl =
            "https://accounts.google.com/ServiceLogin?continue=https%3A%2F%2Fwww.youtube.com%2F&service=youtube";

        const listResponse = await fetch(`http://${host}:${port}/json`);
        const existingTargets = (await listResponse.json()) as Array<{
            id: string;
            url: string;
        }>;

        if (!this.browser?.connected) {
            throw new Error("Browser is not connected");
        }

        const pages = await this.browser.pages();
        const page = pages[0] ?? (await this.browser.newPage());
        await this.applyStealthToPage(page);
        await page.setViewport({ width: 1280, height: 720 });

        try {
            await page.goto("https://www.youtube.com", {
                waitUntil: "domcontentloaded",
                timeout: PAGE_NAVIGATION_TIMEOUT_MS,
            });
            await new Promise((resolve) => setTimeout(resolve, 2_000));
        } catch {}

        await page.goto(loginUrl, {
            waitUntil: "domcontentloaded",
            timeout: PAGE_NAVIGATION_TIMEOUT_MS,
        });

        const currentUrl = page.url();
        if (currentUrl.includes("CookieMismatch") || currentUrl.includes("cookie_disabled")) {
            container.logger.warn(
                "[GoogleLogin] Google CookieMismatch detected, clearing browser cookies and retrying...",
            );

            const cdp = await page.createCDPSession();
            await cdp.send("Network.clearBrowserCookies");
            await cdp.detach();

            await new Promise((resolve) => setTimeout(resolve, 1_000));

            await page.goto("https://www.youtube.com", {
                waitUntil: "domcontentloaded",
                timeout: PAGE_NAVIGATION_TIMEOUT_MS,
            });
            await new Promise((resolve) => setTimeout(resolve, 2_000));

            await page.goto(loginUrl, {
                waitUntil: "domcontentloaded",
                timeout: PAGE_NAVIGATION_TIMEOUT_MS,
            });
        }

        const updatedResponse = await fetch(`http://${host}:${port}/json`);
        const targets = (await updatedResponse.json()) as Array<{
            id: string;
            url: string;
        }>;
        const loginTarget = targets.find((t) => t.url.includes("accounts.google.com"));
        this.loginTargetId = loginTarget?.id ?? targets[0]?.id ?? null;

        for (const target of existingTargets) {
            if (target.url === "about:blank" && target.id !== this.loginTargetId) {
                try {
                    await fetch(`http://${host}:${port}/json/close/${target.id}`);
                } catch {}
            }
        }

        if (!this.loginTargetId) {
            throw new Error("Could not determine login page target ID");
        }

        this.inspectUrl = `http://${host}:${port}/devtools/inspector.html?ws=${host}:${port}/devtools/page/${this.loginTargetId}`;
        this.currentLoginUrl = loginUrl;
    }

    private async connectPuppeteerAndExportCookies(): Promise<boolean> {
        if (!this.browser?.connected) {
            if (!this.browserWSEndpoint) {
                const port = this.actualPort ?? this.devtoolsPort;
                const versionResponse = await fetch(`http://127.0.0.1:${port}/json/version`);
                const versionInfo = (await versionResponse.json()) as {
                    webSocketDebuggerUrl?: string;
                };
                this.browserWSEndpoint = versionInfo.webSocketDebuggerUrl ?? null;

                if (!this.browserWSEndpoint) {
                    throw new Error("Cannot determine browser WebSocket endpoint");
                }
            }

            this.browser = await puppeteer.connect({
                browserWSEndpoint: this.browserWSEndpoint,
            });
        }

        const pages = await this.browser.pages();
        this.page = pages[0] ?? null;

        if (this.page) {
            await this.page.setViewport({ width: 1280, height: 720 });
        }

        const ssoOk = await this.navigateToYouTubeForSSO();
        if (!ssoOk) {
            container.logger.warn(
                "[GoogleLogin] YouTube SSO failed — LOGIN_INFO not found. Not exporting cookies.",
            );
            return false;
        }

        const exported = await this.exportCookies();
        if (!exported) {
            return false;
        }

        const hasCritical = this.verifyExportedCookiesHaveLogin();
        if (!hasCritical) {
            container.logger.warn(
                "[GoogleLogin] Exported cookies lack LOGIN_INFO — session may be guest. Aborting.",
            );
            return false;
        }

        return true;
    }

    private verifyExportedCookiesHaveLogin(): boolean {
        try {
            const content = readFileSync(this.paths.cookiesFilePath, "utf8");
            return content.includes("LOGIN_INFO") && content.includes("SID");
        } catch {
            return false;
        }
    }

    private async navigateToYouTubeForSSO(): Promise<boolean> {
        if (!this.page || this.page.isClosed()) {
            return false;
        }

        container.logger.info(
            "[GoogleLogin] Navigating to YouTube to finalize SSO cookies (polling)...",
        );

        const checkForLoginInfo = async (): Promise<boolean> => {
            const cdp = await this.page!.createCDPSession();
            const { cookies } = (await cdp.send("Network.getAllCookies")) as {
                cookies: Array<{ name: string; domain: string }>;
            };
            await cdp.detach();

            const hasLoginInfo = cookies.some(
                (c) => c.name === "LOGIN_INFO" && c.domain.includes("youtube"),
            );
            const hasSID = cookies.some((c) => c.name === "SID" && c.domain.includes("youtube"));

            if (hasSID) {
                container.logger.debug(
                    "[GoogleLogin] YouTube SSO: SID cookie present on .youtube.com",
                );
            }

            return hasLoginInfo;
        };

        const pollUntilReady = async (): Promise<boolean> => {
            const start = Date.now();
            while (Date.now() - start < LOGIN_SSO_MAX_WAIT_MS) {
                if (await checkForLoginInfo()) {
                    return true;
                }
                await new Promise((resolve) => setTimeout(resolve, LOGIN_SSO_POLL_MS));
            }
            return false;
        };

        const maxAttempts = 3;

        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                if (attempt === 1) {
                    await this.page.goto("https://www.youtube.com", {
                        waitUntil: "domcontentloaded",
                        timeout: PAGE_NAVIGATION_TIMEOUT_MS,
                    });
                } else {
                    container.logger.info(
                        `[GoogleLogin] YouTube SSO: attempt ${attempt}/${maxAttempts}, reloading...`,
                    );
                    await this.page.reload({
                        waitUntil: "domcontentloaded",
                        timeout: PAGE_NAVIGATION_TIMEOUT_MS,
                    });
                }

                if (await pollUntilReady()) {
                    container.logger.info(
                        `[GoogleLogin] YouTube SSO complete — LOGIN_INFO present (attempt ${attempt})`,
                    );
                    return true;
                }

                if (attempt < maxAttempts) {
                    container.logger.debug(
                        `[GoogleLogin] LOGIN_INFO not found after ${LOGIN_SSO_MAX_WAIT_MS}ms, retrying...`,
                    );
                }
            } catch (err) {
                container.logger.warn(`[GoogleLogin] YouTube SSO attempt ${attempt} failed:`, err);
            }
        }

        container.logger.warn(
            "[GoogleLogin] YouTube SSO failed — LOGIN_INFO not found after all retries",
        );
        return false;
    }

    private async extractAccountName(): Promise<void> {
        if (!this.page || this.page.isClosed()) {
            return;
        }

        for (let attempt = 1; attempt <= EXTRACT_ACCOUNT_RETRIES; attempt++) {
            const extracted = await this.tryExtractAccountNameOnce();
            if (extracted) {
                return;
            }
            if (attempt < EXTRACT_ACCOUNT_RETRIES) {
                container.logger.debug(
                    `[GoogleLogin] Account name not ready (attempt ${attempt}), retrying in ${EXTRACT_ACCOUNT_RETRY_DELAY_MS}ms...`,
                );
                await new Promise((resolve) => setTimeout(resolve, EXTRACT_ACCOUNT_RETRY_DELAY_MS));
            }
        }

        if (!this.loginEmail) {
            container.logger.warn(
                "[GoogleLogin] Could not extract account name from YouTube page after retries",
            );
        }
    }

    private async tryExtractAccountNameOnce(): Promise<boolean> {
        if (!this.page || this.page.isClosed()) {
            return false;
        }

        try {
            const ytcfgName = (await this.page.evaluate(
                `(() => {
                    try {
                        if (typeof ytcfg !== "undefined" && ytcfg.get) {
                            return ytcfg.get("CHANNEL_NAME") || ytcfg.get("LOGGED_IN_USER") || null;
                        }
                        if (typeof yt !== "undefined" && yt.config_ && yt.config_.CHANNEL_NAME) {
                            return yt.config_.CHANNEL_NAME;
                        }
                    } catch {}
                    return null;
                })()`,
            )) as string | null;

            if (ytcfgName) {
                this.loginEmail = ytcfgName;
                container.logger.info(`[GoogleLogin] Account name extracted: ${ytcfgName}`);
                return true;
            }

            const scriptName = (await this.page.evaluate(
                `(() => {
                    try {
                        const scripts = document.querySelectorAll("script");
                        for (const s of scripts) {
                            const t = s.textContent || "";
                            if (!t.includes("accountName")) continue;
                            const m = /"accountName"\\s*:\\s*\\{\\s*"simpleText"\\s*:\\s*"([^"]+)"/.exec(t);
                            if (m) return m[1];
                        }
                    } catch {}
                    return null;
                })()`,
            )) as string | null;

            if (scriptName) {
                this.loginEmail = scriptName;
                container.logger.info(
                    `[GoogleLogin] Account name extracted via script: ${scriptName}`,
                );
                return true;
            }

            const avatarClicked = await this.page.evaluate(
                `(() => {
                    const avatar = document.querySelector("button#avatar-btn");
                    if (avatar) { avatar.click(); return true; }
                    return false;
                })()`,
            );

            if (avatarClicked) {
                await new Promise((resolve) => setTimeout(resolve, 2_000));

                const popupName = (await this.page.evaluate(
                    `(() => {
                        const selectors = [
                            "#account-name",
                            "yt-formatted-string#account-name",
                            "#channel-handle",
                            "[id*='email']"
                        ];
                        for (const sel of selectors) {
                            const el = document.querySelector(sel);
                            if (el && el.textContent && el.textContent.trim()) return el.textContent.trim();
                        }
                        return null;
                    })()`,
                )) as string | null;

                if (popupName) {
                    this.loginEmail = popupName;
                    container.logger.info(
                        `[GoogleLogin] Account name extracted via popup: ${popupName}`,
                    );
                }

                await this.page.keyboard.press("Escape");
            }

            return !!this.loginEmail;
        } catch (err) {
            container.logger.warn("[GoogleLogin] tryExtractAccountNameOnce failed:", err);
            return false;
        }
    }

    private waitForLogin(): Promise<boolean> {
        const port = this.actualPort ?? this.devtoolsPort;
        const host = "127.0.0.1";

        return new Promise<boolean>((resolve) => {
            this.loginCheckInterval = setInterval(async () => {
                try {
                    const response = await fetch(`http://${host}:${port}/json`);
                    const targets = (await response.json()) as Array<{
                        id: string;
                        url: string;
                    }>;

                    const loginTarget = targets.find((t) => t.id === this.loginTargetId);

                    if (!loginTarget) {
                        this.cleanupLoginWait();
                        resolve(false);
                        return;
                    }

                    const url = loginTarget.url;
                    this.currentLoginUrl = url;

                    const isPostLoginUrl =
                        url.includes("myaccount.google.com") ||
                        url.includes("youtube.com") ||
                        url.includes("google.com/webhp") ||
                        url.includes("google.com/?") ||
                        url.endsWith("google.com") ||
                        url.endsWith("google.com/");

                    const isErrorPage =
                        url.includes("CookieMismatch") ||
                        url.includes("cookie_disabled") ||
                        url.includes("/sorry/") ||
                        url.includes("accounts.google.com");

                    if (isPostLoginUrl && !isErrorPage) {
                        const hasSession = await this.verifyGoogleSessionCookies();
                        if (hasSession) {
                            this.cleanupLoginWait();
                            resolve(true);
                            return;
                        }
                        container.logger.warn(
                            `[GoogleLogin] URL looks post-login (${url.substring(0, 80)}) but no session cookies found yet, waiting...`,
                        );
                    }
                } catch {}
            }, LOGIN_CHECK_INTERVAL_MS);

            this.loginTimeout = setTimeout(() => {
                this.cleanupLoginWait();
                resolve(false);
            }, LOGIN_TIMEOUT_MS);
        });
    }

    private cleanupLoginWait(): void {
        if (this.loginCheckInterval) {
            clearInterval(this.loginCheckInterval);
            this.loginCheckInterval = null;
        }
        if (this.loginTimeout) {
            clearTimeout(this.loginTimeout);
            this.loginTimeout = null;
        }
    }

    private async verifyGoogleSessionCookies(): Promise<boolean> {
        try {
            if (!this.browser?.connected) {
                return false;
            }

            const pages = await this.browser.pages();
            const page = pages[0];
            if (!page) {
                return false;
            }

            const cdp = await page.createCDPSession();
            const { cookies } = (await cdp.send("Network.getAllCookies")) as {
                cookies: Array<{ name: string; domain: string }>;
            };
            await cdp.detach();

            const hasSID = cookies.some((c) => c.name === "SID" && c.domain.includes("google"));
            const hasHSID = cookies.some((c) => c.name === "HSID" && c.domain.includes("google"));

            return hasSID && hasHSID;
        } catch {
            return false;
        }
    }

    public getExtractorArgs(): string | null {
        if (this.visitorData) {
            return `youtube:visitor_data=${this.visitorData}`;
        }

        return null;
    }

    public async exportCookies(): Promise<boolean> {
        if (!this.browser?.connected) {
            throw new Error("Browser is not running");
        }

        try {
            const pages = await this.browser.pages();
            const page = pages[0];
            if (!page) {
                throw new Error("No pages available");
            }

            const client = await page.createCDPSession();

            const { cookies } = (await client.send("Network.getAllCookies")) as {
                cookies: Cookie[];
            };

            await client.detach();

            const relevantCookies = cookies.filter((cookie) =>
                YOUTUBE_DOMAINS.some(
                    (domain) => cookie.domain.endsWith(domain) || cookie.domain === domain.slice(1),
                ),
            );

            if (relevantCookies.length === 0) {
                container.logger.warn("[GoogleLogin] No relevant cookies found to export");
                return false;
            }

            const allCookieNames = relevantCookies.map((c) => c.name);
            const hasCritical = CRITICAL_YOUTUBE_COOKIES.filter((name) =>
                allCookieNames.includes(name),
            );
            const missingCritical = CRITICAL_YOUTUBE_COOKIES.filter(
                (name) => !allCookieNames.includes(name),
            );

            const netscapeCookies = this.toNetscapeFormat(relevantCookies);

            writeFileSync(this.paths.cookiesFilePath, netscapeCookies, "utf8");

            const backupPath = `${this.paths.cookiesFilePath}.backup`;
            writeFileSync(backupPath, netscapeCookies, "utf8");

            this.lastCookieRefresh = Date.now();

            const ytCookieCount = relevantCookies.filter((c) =>
                c.domain.includes("youtube"),
            ).length;

            container.logger.info(
                `[GoogleLogin] Exported ${relevantCookies.length} cookies to ${this.paths.cookiesFilePath}` +
                    ` (YouTube: ${ytCookieCount}` +
                    `, critical: ${hasCritical.join(",") || "NONE"}, missing: ${missingCritical.join(",") || "none"})`,
            );

            this.validateCookieFile();
            return true;
        } catch (err) {
            container.logger.error("[GoogleLogin] Failed to export cookies:", err);
            throw err;
        }
    }

    private toNetscapeFormat(cookies: Cookie[]): string {
        const lines: string[] = [
            "# Netscape HTTP Cookie File",
            "# This file is auto-generated by rawon GoogleLoginManager",
            "# https://curl.se/docs/http-cookies.html",
            "",
        ];

        for (const cookie of cookies) {
            const isDomainCookie = cookie.domain.startsWith(".");
            const domain = cookie.domain;
            const includeSubDomains = isDomainCookie ? "TRUE" : "FALSE";
            const secure = cookie.secure ? "TRUE" : "FALSE";
            const expiry = cookie.expires > 0 ? Math.floor(cookie.expires) : 0;

            const httpOnlyPrefix = cookie.httpOnly ? "#HttpOnly_" : "";

            lines.push(
                `${httpOnlyPrefix}${domain}\t${includeSubDomains}\t${cookie.path}\t${secure}\t${expiry}\t${cookie.name}\t${cookie.value}`,
            );
        }

        return `${lines.join("\n")}\n`;
    }

    private validateCookieFile(): void {
        try {
            const content = readFileSync(this.paths.cookiesFilePath, "utf8");
            const lines = content.split("\n");
            let cookieCount = 0;
            let httpOnlyCount = 0;
            let criticalCount = 0;
            const domains = new Set<string>();

            for (const line of lines) {
                if ((line.startsWith("#") && !line.startsWith("#HttpOnly_")) || !line.trim()) {
                    continue;
                }

                const isHttpOnly = line.startsWith("#HttpOnly_");
                const cookieLine = isHttpOnly ? line.slice(10) : line;
                const parts = cookieLine.split("\t");
                if (parts.length < 7) {
                    container.logger.warn(
                        `[GoogleLogin] Cookie file validation: malformed line: ${line.substring(0, 80)}`,
                    );
                    continue;
                }

                cookieCount++;
                if (isHttpOnly) {
                    httpOnlyCount++;
                }
                if (CRITICAL_YOUTUBE_COOKIES.includes(parts[5])) {
                    criticalCount++;
                }
                domains.add(parts[0]);
            }

            container.logger.debug(
                `[GoogleLogin] Cookie file validation: ${cookieCount} cookies (${httpOnlyCount} httpOnly, ${criticalCount} critical), domains: ${[...domains].join(", ")}`,
            );
        } catch (err) {
            container.logger.warn("[GoogleLogin] Cookie file validation failed:", err);
        }
    }

    public async shutdown(): Promise<void> {
        this.cleanupLoginWait();
        this.stopDevtoolsProxy();

        if (this.browser) {
            this.browser.removeAllListeners("disconnected");
            try {
                await this.browser.close();
            } catch {
                if (this.chromeProcess && !this.chromeProcess.killed) {
                    try {
                        this.chromeProcess.kill();
                    } catch {}
                }
            }
        } else if (this.chromeProcess && !this.chromeProcess.killed) {
            try {
                this.chromeProcess.kill();
            } catch {}
        }

        this.browser = null;
        this.page = null;
        this.chromeProcess = null;
        this.debugUrl = null;
        this.inspectUrl = null;
        this.loginTargetId = null;
        this.browserWSEndpoint = null;
        this.currentLoginUrl = null;

        container.logger.info("[GoogleLogin] Shutdown complete");
    }

    public async close(): Promise<void> {
        this.cleanupLoginWait();
        this.stopDevtoolsProxy();

        if (this.browser) {
            this.browser.removeAllListeners("disconnected");
            try {
                await this.browser.close();
            } catch {
                if (this.chromeProcess && !this.chromeProcess.killed) {
                    try {
                        this.chromeProcess.kill();
                    } catch {}
                }
            }
        } else if (this.chromeProcess && !this.chromeProcess.killed) {
            try {
                this.chromeProcess.kill();
            } catch {}
        }

        try {
            rmSync(this.paths.userDataDir, { recursive: true, force: true });
            container.logger.info("[GoogleLogin] Browser profile directory wiped");
        } catch (err) {
            container.logger.warn("[GoogleLogin] Failed to wipe browser profile:", err);
        }

        for (const filePath of [
            this.paths.cookiesFilePath,
            `${this.paths.cookiesFilePath}.backup`,
        ]) {
            try {
                unlinkSync(filePath);
            } catch {}
        }

        this.clearSessionState();
        this.browser = null;
        this.page = null;
        this.chromeProcess = null;
        this.debugUrl = null;
        this.inspectUrl = null;
        this.loginTargetId = null;
        this.browserWSEndpoint = null;
        this.currentLoginUrl = null;
        this.loginEmail = null;
        this.visitorData = null;
        this.lastCookieRefresh = null;
        this.status = "idle";

        container.logger.info(
            "[GoogleLogin] Logout complete — all browser state and cookies cleared",
        );
    }

    public getDebugUrl(): string | null {
        return this.debugUrl;
    }

    public getLoginTimeoutMs(): number {
        return LOGIN_TIMEOUT_MS;
    }

    public restoreSessionFromDB(): boolean {
        const state = this.getPersistedSessionState();
        if (!state?.wasRunning) {
            return false;
        }

        if (!this.hasCookies()) {
            container.logger.info(
                "[GoogleLogin] Session state found but cookies missing, clearing state",
            );
            this.clearSessionState();
            return false;
        }

        if (state.email) {
            this.loginEmail = state.email;
        }
        if (state.visitorData) {
            this.visitorData = state.visitorData;
        }

        this.status = "logged_in";
        this.lastCookieRefresh = Date.now();

        container.logger.info(
            `[GoogleLogin] Session restored from DB. Account: ${this.loginEmail ?? "unknown"}. Using cookies from disk.`,
        );
        return true;
    }

    private saveSessionState(): void {
        try {
            this.db
                .prepare(
                    `INSERT INTO login_session (id, was_running, email, visitor_data, saved_at)
                     VALUES (1, 1, ?, ?, ?)
                     ON CONFLICT(id) DO UPDATE SET was_running = 1, email = excluded.email, visitor_data = excluded.visitor_data, saved_at = excluded.saved_at`,
                )
                .run(this.loginEmail, this.visitorData, Date.now());
            container.logger.debug("[GoogleLogin] Session state saved");
        } catch (err) {
            container.logger.warn("[GoogleLogin] Failed to save session state:", err);
        }
    }

    private clearSessionState(): void {
        try {
            this.db.prepare("DELETE FROM login_session WHERE id = 1").run();
            container.logger.debug("[GoogleLogin] Session state cleared");
        } catch {}
    }

    private getPersistedSessionState(): {
        wasRunning: boolean;
        email: string | null;
        visitorData: string | null;
    } | null {
        try {
            const row = this.db
                .prepare("SELECT was_running, email, visitor_data FROM login_session WHERE id = 1")
                .get() as
                | {
                      was_running: number;
                      email: string | null;
                      visitor_data: string | null;
                  }
                | undefined;
            if (!row || !row.was_running) {
                return null;
            }
            return {
                wasRunning: true,
                email: row.email,
                visitorData: row.visitor_data,
            };
        } catch {
            return null;
        }
    }
}
