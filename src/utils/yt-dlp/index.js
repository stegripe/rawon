import { spawn } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import nodePath from "node:path";
import process from "node:process";
import got from "got";

const suffix = process.platform === "win32" ? ".exe" : (
    process.platform === "darwin" ? "_macos" : ""
);
const filename = `yt-dlp${suffix}`;
const scriptsPath = nodePath.resolve(process.cwd(), "cache", "scripts");
const exePath = nodePath.resolve(scriptsPath, filename);

// Cookie path - only use the browser-based cookie implementation
// Cookies are saved by YouTubeCookieManager to cache/cookies.txt
const browserCookiesPath = nodePath.resolve(process.cwd(), "cache", "cookies.txt");

function isValidCookiesFile(filePath) {
    try {
        if (!existsSync(filePath)) {
            return false;
        }
        
        // Check file size - must be at least 100 bytes for valid cookies
        const stats = statSync(filePath);
        if (stats.size < 100) {
            console.warn(`[yt-dlp] Cookies file is too small (${stats.size} bytes). Run 'ytcookies login' to set up cookies.`);
            return false;
        }
        
        // Check file content - must have Netscape cookie format header
        const content = readFileSync(filePath, "utf8");
        if (!content.includes("# Netscape HTTP Cookie File") && !content.includes("# HTTP Cookie File")) {
            console.warn("[yt-dlp] Cookies file is not in valid Netscape format. Run 'ytcookies login' to set up cookies.");
            return false;
        }
        
        // Check for YouTube/Google cookies
        if (!content.includes("youtube.com") && !content.includes("google.com")) {
            console.warn("[yt-dlp] Cookies file does not contain YouTube/Google cookies. Run 'ytcookies login' to set up cookies.");
            return false;
        }
        
        return true;
    } catch (error) {
        console.warn("[yt-dlp] Error validating cookies file:", error.message);
        return false;
    }
}

function getYoutubeCookiesPath() {
    // Only use cookies saved by the browser login feature (ytcookies command)
    if (isValidCookiesFile(browserCookiesPath)) {
        return browserCookiesPath;
    }
    
    console.warn("[yt-dlp] No valid cookies found! Run 'ytcookies login' command in Discord to set up browser-based authentication.");
    return "";
}

function args(url, options) {
    const optArgs = Object.entries(options)
        .flatMap(([key, val]) => {
            const flag = key.replaceAll(/[A-Z]/gu, ms => `-${ms.toLowerCase()}`);
            return [
                `--${(typeof val === "boolean") && !val ? "no-" : ""}${flag}`,
                typeof val === "boolean" ? "" : val
            ]
        })
        .filter(Boolean);

    const youtubeCookiesPath = getYoutubeCookiesPath();
    if (youtubeCookiesPath) {
        console.info(`[yt-dlp] Using cookies from: ${youtubeCookiesPath}`);
        optArgs.push("--cookies", youtubeCookiesPath);
    }

    return [url, ...optArgs];
}

function json(str) {
    try {
        return JSON.parse(str);
    } catch {
        return str;
    }
}

export async function downloadExecutable() {
    if (!existsSync(exePath)) {
        console.info("[INFO] Yt-dlp couldn't be found, trying to download...");
        const releases = await got.get("https://api.github.com/repos/yt-dlp/yt-dlp/releases?per_page=1").json();
        const release = releases[0];
        const asset = release.assets.find(ast => ast.name === filename);
        await new Promise((resolve, reject) => {
            got.get(asset.browser_download_url).buffer().then(x => {
                mkdirSync(scriptsPath, { recursive: true });
                writeFileSync(exePath, x, { mode: 0o777 });
                return 0;
            }).then(resolve).catch(reject);
        });
        console.info("[INFO] Yt-dlp has been downloaded.");
    }
}

export const exec = (url, options = {}, spawnOptions = {}) => spawn(exePath, args(url, options), {
    windowsHide: true,
    ...spawnOptions
});

export default async function ytdl(url, options = {}, spawnOptions = {}) {
    const proc = exec(url, options, spawnOptions);
    let data = "";

    await new Promise((resolve, reject) => {
        proc.on("error", reject)
            .on("close", resolve)
            .stdout.on("data", (chunk) => (data += chunk));
    });
    return json(data);
}
