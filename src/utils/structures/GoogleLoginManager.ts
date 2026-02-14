import { type ChildProcess, execSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, unlinkSync, writeFileSync } from "node:fs";
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
import puppeteer, { type Browser, type Cookie, type Page } from "puppeteer-core";

export type LoginStatus = "idle" | "waiting_for_login" | "logged_in" | "error";

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
}

const YOUTUBE_DOMAINS = [
    ".youtube.com",
    ".google.com",
    ".googlevideo.com",
    ".googleapis.com",
    ".accounts.google.com",
    ".youtu.be",
];

const COOKIE_REFRESH_INTERVAL_MS = 30 * 60 * 1000;
const LOGIN_CHECK_INTERVAL_MS = 5_000;
const LOGIN_TIMEOUT_MS = 5 * 60 * 1000;
const PAGE_NAVIGATION_TIMEOUT_MS = 30_000;

export class GoogleLoginManager {
    private browser: Browser | null = null;
    private page: Page | null = null;
    private status: LoginStatus = "idle";
    private debugUrl: string | null = null;
    private inspectUrl: string | null = null;
    private loginEmail: string | null = null;
    private lastCookieRefresh: number | null = null;
    private error: string | null = null;
    private refreshInterval: ReturnType<typeof setInterval> | null = null;
    private loginCheckInterval: ReturnType<typeof setInterval> | null = null;
    private loginTimeout: ReturnType<typeof setTimeout> | null = null;

    private readonly paths: BrowserPaths;
    private readonly chromiumPath: string | null;
    private readonly devtoolsPort: number;
    private actualPort: number | null = null;
    private chromeProcess: ChildProcess | null = null;
    private loginTargetId: string | null = null;
    private browserWSEndpoint: string | null = null;
    private currentLoginUrl: string | null = null;
    private proxyServer: Server | null = null;

    public constructor(chromiumPath?: string, devtoolsPort = 3000) {
        const cacheDir = path.resolve(process.cwd(), "cache");

        this.paths = {
            userDataDir: path.resolve(cacheDir, "cookies", "browser-profile"),
            cookiesFilePath: path.resolve(cacheDir, "cookies", "cookies.txt"),
        };

        this.chromiumPath = chromiumPath ?? null;
        this.devtoolsPort = devtoolsPort;

        this.ensureDirectories();
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
                container.logger.info(`[GoogleLogin] Removed stale lock file: ${lockFile}`);
            } catch {
                // File doesn't exist, ignore
            }
        }
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
                    container.logger.info(
                        `[GoogleLogin] Found system Chrome (${channel}): ${sysPath}`,
                    );
                    return sysPath;
                }
            } catch {
                // Channel not installed, try next
            }
        }

        const candidates = this.getCandidatePaths();

        for (const candidate of candidates) {
            if (candidate && existsSync(candidate)) {
                container.logger.info(`[GoogleLogin] Found browser at: ${candidate}`);
                return candidate;
            }
        }

        const foundInPath = this.findBrowserInPath();
        if (foundInPath) {
            container.logger.info(`[GoogleLogin] Found browser in PATH: ${foundInPath}`);
            return foundInPath;
        }

        try {
            const puppeteerFull = await import("puppeteer");
            const execPath = puppeteerFull.executablePath();
            if (execPath && existsSync(execPath)) {
                container.logger.info(`[GoogleLogin] Using puppeteer bundled browser: ${execPath}`);
                return execPath;
            }
        } catch {
            // Not available
        }

        const downloadDir = path.resolve(process.cwd(), "cache", "scripts", "chrome");
        const existingPath = this.findDownloadedBrowser(downloadDir);
        if (existingPath) {
            container.logger.info(
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
            } catch {
                // Not found, continue
            }
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
                            } catch {
                                // Not a valid build, continue
                            }
                        }
                    }
                }
            }
        } catch {
            // Error reading directory
        }

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

    public async launchBrowser(): Promise<string> {
        if (this.browser?.connected) {
            this.debugUrl = this.getDevtoolsBaseUrl();
            return this.debugUrl;
        }

        const browserPath = await this.findBrowserPath();
        const port = this.devtoolsPort;
        const useHeadless = process.platform === "linux" && !process.env.DISPLAY;

        container.logger.info(
            `[GoogleLogin] Launching browser from: ${browserPath}${useHeadless ? " (headless)" : ""}`,
        );

        if (useHeadless) {
            container.logger.warn(
                "[GoogleLogin] No display found. Using headless mode. " +
                    "Note: Google may block sign-in from headless browsers.",
            );
        }

        this.cleanProfileLocks();

        this.browser = await puppeteer.launch({
            executablePath: browserPath,
            headless: useHeadless,
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
                "--window-size=1280,720",
                "--remote-allow-origins=*",
            ],
            defaultViewport: { width: 1280, height: 720 },
        });

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
            this.handleBrowserDisconnect();
        });

        this.inspectUrl = await this.buildInspectUrl();

        container.logger.info(
            `[GoogleLogin] Browser launched. DevTools: ${this.debugUrl}, Inspect URL: ${this.inspectUrl ?? "N/A"}`,
        );

        return this.debugUrl;
    }

    private async launchBrowserHeadless(): Promise<void> {
        if (this.browser?.connected) {
            return;
        }

        const browserPath = await this.findBrowserPath();
        const port = this.devtoolsPort;

        container.logger.info("[GoogleLogin] Launching headless browser for session check...");

        this.cleanProfileLocks();

        this.browser = await puppeteer.launch({
            executablePath: browserPath,
            headless: true,
            pipe: false,
            userDataDir: this.paths.userDataDir,
            args: [
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-dev-shm-usage",
                "--disable-gpu",
                "--disable-extensions",
                "--no-first-run",
                "--disable-background-networking",
                "--disable-default-apps",
                "--disable-sync",
                "--disable-translate",
                "--disable-blink-features=AutomationControlled",
                "--remote-allow-origins=*",
            ],
            defaultViewport: { width: 1280, height: 720 },
        });

        this.chromeProcess = this.browser.process() ?? null;
        this.browserWSEndpoint = this.browser.wsEndpoint();

        const chromeDebugPort = this.extractPortFromWsEndpoint(this.browserWSEndpoint);
        await this.startDevtoolsProxy(port, chromeDebugPort);
        this.actualPort = port;

        this.browser.on("disconnected", () => {
            container.logger.warn("[GoogleLogin] Headless browser exited");
            this.stopDevtoolsProxy();
            this.chromeProcess = null;
            this.handleBrowserDisconnect();
        });
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
                container.logger.info(
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
                await this.connectPuppeteerAndExportCookies();
                this.status = "logged_in";

                container.logger.info(
                    `[GoogleLogin] Login successful! Email: ${this.loginEmail ?? "unknown"}`,
                );

                await this.relaunchAsHeadless();

                return true;
            }

            this.status = "error";
            this.error = "Login timed out or was cancelled";
            container.logger.warn("[GoogleLogin] Login timed out or was cancelled");
            return false;
        } catch (err) {
            this.status = "error";
            this.error = (err as Error).message;
            container.logger.error("[GoogleLogin] Login failed:", err);
            return false;
        }
    }

    private async navigateToLoginPage(): Promise<void> {
        const port = this.actualPort ?? this.devtoolsPort;
        const host = "127.0.0.1";
        const loginUrl = "https://accounts.google.com/signin";

        const listResponse = await fetch(`http://${host}:${port}/json`);
        const existingTargets = (await listResponse.json()) as Array<{
            id: string;
            url: string;
        }>;

        let navigated = false;

        try {
            const newTabResponse = await fetch(`http://${host}:${port}/json/new?${loginUrl}`, {
                method: "PUT",
            });

            if (newTabResponse.ok) {
                const targetInfo = (await newTabResponse.json()) as { id: string };
                this.loginTargetId = targetInfo.id;
                navigated = true;
            }
        } catch {
            // /json/new endpoint not available
        }

        if (!navigated) {
            container.logger.info(
                "[GoogleLogin] /json/new unavailable, using puppeteer navigation",
            );

            if (!this.browser?.connected) {
                throw new Error("Browser is not connected");
            }

            const pages = await this.browser.pages();
            const page = pages[0] ?? (await this.browser.newPage());
            await page.setViewport({ width: 1280, height: 720 });
            await page.goto(loginUrl, {
                waitUntil: "domcontentloaded",
                timeout: PAGE_NAVIGATION_TIMEOUT_MS,
            });

            const updatedResponse = await fetch(`http://${host}:${port}/json`);
            const targets = (await updatedResponse.json()) as Array<{
                id: string;
                url: string;
            }>;
            const loginTarget = targets.find((t) => t.url.includes("accounts.google.com"));
            this.loginTargetId = loginTarget?.id ?? targets[0]?.id ?? null;
        }

        for (const target of existingTargets) {
            if (target.url === "about:blank" && target.id !== this.loginTargetId) {
                try {
                    await fetch(`http://${host}:${port}/json/close/${target.id}`);
                } catch {
                    // Ignore
                }
            }
        }

        if (!this.loginTargetId) {
            throw new Error("Could not determine login page target ID");
        }

        this.inspectUrl = `http://${host}:${port}/devtools/inspector.html?ws=${host}:${port}/devtools/page/${this.loginTargetId}`;
        this.currentLoginUrl = loginUrl;
    }

    private async connectPuppeteerAndExportCookies(): Promise<void> {
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

            this.browser.on("disconnected", () => {
                container.logger.warn("[GoogleLogin] Browser disconnected");
                this.handleBrowserDisconnect();
            });
        }

        const pages = await this.browser.pages();
        this.page = pages[0] ?? null;

        if (this.page) {
            await this.page.setViewport({ width: 1280, height: 720 });

            await this.page.goto("https://www.youtube.com", {
                waitUntil: "networkidle2",
                timeout: PAGE_NAVIGATION_TIMEOUT_MS,
            });

            await new Promise((resolve) => setTimeout(resolve, 2_000));

            await this.checkYouTubeLoginStatus();
        }

        await this.exportCookies();
    }

    public async checkExistingSession(): Promise<boolean> {
        if (!this.browser?.connected) {
            await this.launchBrowserHeadless();
        }

        try {
            const pages = await this.browser!.pages();
            this.page = pages.length > 0 ? pages[0] : await this.browser!.newPage();

            await this.page.setViewport({ width: 1280, height: 720 });

            await this.page.goto("https://www.youtube.com", {
                waitUntil: "networkidle2",
                timeout: PAGE_NAVIGATION_TIMEOUT_MS,
            });

            const isLoggedIn = await this.checkYouTubeLoginStatus();

            if (isLoggedIn) {
                this.status = "logged_in";
                await this.exportCookies();
                this.startCookieRefreshLoop();
                container.logger.info(
                    `[GoogleLogin] Existing session found! Email: ${this.loginEmail ?? "unknown"}`,
                );
                return true;
            }

            this.browser!.disconnect();
            this.browser = null;
            this.page = null;

            container.logger.info("[GoogleLogin] No existing session found");
            return false;
        } catch (err) {
            container.logger.warn("[GoogleLogin] Could not check existing session:", err);
            if (this.browser?.connected) {
                try {
                    this.browser.disconnect();
                } catch {
                    // Ignore
                }
            }
            this.browser = null;
            this.page = null;
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

                    if (
                        url.includes("myaccount.google.com") ||
                        url.includes("youtube.com") ||
                        (url.includes("google.com") &&
                            !url.includes("accounts.google.com/signin") &&
                            !url.includes("accounts.google.com/v3/signin") &&
                            !url.includes("accounts.google.com/ServiceLogin") &&
                            !url.includes("accounts.google.com/o/oauth2") &&
                            !url.includes("accounts.google.com/CheckCookie") &&
                            !url.includes("challenge"))
                    ) {
                        this.cleanupLoginWait();
                        resolve(true);
                        return;
                    }
                } catch {
                    // Debug server not responding, ignore
                }
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

    private async checkYouTubeLoginStatus(): Promise<boolean> {
        if (!this.page || this.page.isClosed()) {
            return false;
        }

        try {
            const currentUrl = this.page.url();

            if (!currentUrl.includes("youtube.com")) {
                await this.page.goto("https://www.youtube.com", {
                    waitUntil: "networkidle2",
                    timeout: PAGE_NAVIGATION_TIMEOUT_MS,
                });
            }

            const isLoggedIn = (await this.page.evaluate(
                /* istanbul ignore next -- browser context */
                `(() => {
                    const avatarButton = document.querySelector(
                        'button#avatar-btn, img.yt-spec-avatar-shape__avatar, #avatar-btn'
                    );
                    if (avatarButton) return true;
                    const signInButton = document.querySelector(
                        'a[href*="accounts.google.com"], ytd-button-renderer.style-suggestive a[href*="ServiceLogin"]'
                    );
                    return !signInButton;
                })()`,
            )) as boolean;

            if (isLoggedIn) {
                await this.extractEmail();
            }

            return isLoggedIn;
        } catch {
            return false;
        }
    }

    private async extractEmail(): Promise<void> {
        if (!this.page || this.page.isClosed()) {
            return;
        }

        try {
            const avatarClicked = await this.page.evaluate(
                /* istanbul ignore next -- browser context */
                `(() => {
                    const avatar = document.querySelector('button#avatar-btn');
                    if (avatar) {
                        avatar.click();
                        return true;
                    }
                    return false;
                })()`,
            );

            if (avatarClicked) {
                await new Promise((resolve) => setTimeout(resolve, 1_000));

                const email = (await this.page.evaluate(
                    /* istanbul ignore next -- browser context */
                    `(() => {
                        const emailEl = document.querySelector(
                            '#account-name, yt-formatted-string#account-name, [id*="email"]'
                        );
                        if (emailEl && emailEl.textContent) return emailEl.textContent.trim();
                        const allText = document.body.innerText;
                        const emailMatch = /[\\w.-]+@(gmail|googlemail|google)\\.\\w+/i.exec(allText);
                        return emailMatch ? emailMatch[0] : null;
                    })()`,
                )) as string | null;

                if (email) {
                    this.loginEmail = email;
                }

                await this.page.keyboard.press("Escape");
            }
        } catch {
            // Non-critical, ignore
        }
    }

    public async exportCookies(): Promise<void> {
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
                return;
            }

            const netscapeCookies = this.toNetscapeFormat(relevantCookies);
            writeFileSync(this.paths.cookiesFilePath, netscapeCookies, "utf8");

            this.lastCookieRefresh = Date.now();

            container.logger.info(
                `[GoogleLogin] Exported ${relevantCookies.length} cookies to ${this.paths.cookiesFilePath}`,
            );
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
            const domain = cookie.domain.startsWith(".") ? cookie.domain : `.${cookie.domain}`;
            const includeSubDomains = domain.startsWith(".") ? "TRUE" : "FALSE";
            const secure = cookie.secure ? "TRUE" : "FALSE";
            const expiry = cookie.expires > 0 ? Math.floor(cookie.expires) : 0;

            lines.push(
                `${domain}\t${includeSubDomains}\t${cookie.path}\t${secure}\t${expiry}\t${cookie.name}\t${cookie.value}`,
            );
        }

        return `${lines.join("\n")}\n`;
    }

    private startCookieRefreshLoop(): void {
        this.stopCookieRefreshLoop();

        this.refreshInterval = setInterval(async () => {
            try {
                if (!this.browser?.connected) {
                    container.logger.warn(
                        "[GoogleLogin] Browser disconnected, stopping cookie refresh",
                    );
                    this.stopCookieRefreshLoop();
                    return;
                }

                if (this.page && !this.page.isClosed()) {
                    await this.page.goto("https://www.youtube.com", {
                        waitUntil: "networkidle2",
                        timeout: PAGE_NAVIGATION_TIMEOUT_MS,
                    });
                    await new Promise((resolve) => setTimeout(resolve, 2_000));
                }

                await this.exportCookies();
                container.logger.info("[GoogleLogin] Cookie refresh completed successfully");
            } catch (err) {
                container.logger.error("[GoogleLogin] Cookie refresh failed:", err);
            }
        }, COOKIE_REFRESH_INTERVAL_MS);

        container.logger.info(
            `[GoogleLogin] Cookie refresh loop started (every ${COOKIE_REFRESH_INTERVAL_MS / 60_000} minutes)`,
        );
    }

    private stopCookieRefreshLoop(): void {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    }

    public async refreshCookiesNow(): Promise<void> {
        if (!this.browser?.connected) {
            throw new Error("Browser is not running. Start a login session first.");
        }

        if (this.page && !this.page.isClosed()) {
            await this.page.goto("https://www.youtube.com", {
                waitUntil: "networkidle2",
                timeout: PAGE_NAVIGATION_TIMEOUT_MS,
            });
            await new Promise((resolve) => setTimeout(resolve, 2_000));
        }

        await this.exportCookies();
    }

    private handleBrowserDisconnect(): void {
        this.stopCookieRefreshLoop();
        this.cleanupLoginWait();
        this.browser = null;
        this.page = null;
        this.debugUrl = null;
        this.inspectUrl = null;
        this.loginTargetId = null;
        this.currentLoginUrl = null;

        if (this.hasCookies() && this.status === "logged_in") {
            container.logger.info(
                "[GoogleLogin] Browser disconnected but cookies still exist. " +
                    "Cookies will continue to work until they expire.",
            );
        } else {
            this.status = "idle";
        }
    }

    private async relaunchAsHeadless(): Promise<void> {
        container.logger.info("[GoogleLogin] Relaunching browser in headless mode...");

        this.stopDevtoolsProxy();

        if (this.browser) {
            this.browser.removeAllListeners("disconnected");
            try {
                await this.browser.close();
            } catch {
                if (this.chromeProcess && !this.chromeProcess.killed) {
                    this.chromeProcess.kill();
                }
            }
        }
        this.browser = null;
        this.page = null;
        this.chromeProcess = null;
        this.browserWSEndpoint = null;

        await new Promise((resolve) => setTimeout(resolve, 2_000));

        await this.launchBrowserHeadless();

        const pages = await this.browser!.pages();
        this.page = pages[0] ?? (await this.browser!.newPage());
        await this.page.setViewport({ width: 1280, height: 720 });

        await this.page.goto("https://www.youtube.com", {
            waitUntil: "networkidle2",
            timeout: PAGE_NAVIGATION_TIMEOUT_MS,
        });
        await new Promise((resolve) => setTimeout(resolve, 2_000));

        await this.exportCookies();

        this.startCookieRefreshLoop();

        container.logger.info(
            "[GoogleLogin] Browser relaunched in headless mode with background cookie refresh.",
        );
    }

    public async close(): Promise<void> {
        this.stopCookieRefreshLoop();
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
                    } catch {
                        // Ignore
                    }
                }
            }
        } else if (this.chromeProcess && !this.chromeProcess.killed) {
            try {
                this.chromeProcess.kill();
            } catch {
                // Ignore
            }
        }

        this.browser = null;
        this.page = null;
        this.chromeProcess = null;
        this.debugUrl = null;
        this.inspectUrl = null;
        this.loginTargetId = null;
        this.browserWSEndpoint = null;
        this.currentLoginUrl = null;
        this.status = "idle";

        container.logger.info("[GoogleLogin] Browser closed");
    }

    public getDebugUrl(): string | null {
        return this.debugUrl;
    }

    public getLoginTimeoutMs(): number {
        return LOGIN_TIMEOUT_MS;
    }
}
