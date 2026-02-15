import { spawn } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, statSync, writeFileSync } from "node:fs";
import nodePath from "node:path";
import process from "node:process";
import got from "got";

const suffix = process.platform === "win32" ? ".exe" : (
    process.platform === "darwin" ? "_macos" : ""
);
const filename = `yt-dlp${suffix}`;
const scriptsPath = nodePath.resolve(process.cwd(), "cache", "scripts");
const exePath = nodePath.resolve(scriptsPath, filename);

const UPDATE_INTERVAL_MS = 24 * 60 * 60 * 1000;

let cookiesManagerRef = null;
let lastArgsLog = 0;

export function setCookiesManager(manager) {
    cookiesManagerRef = manager;
}

export function getCookiesManager() {
    return cookiesManagerRef;
}

function args(url, options, cookiesPath) {
    const optArgs = Object.entries(options)
        .flatMap(([key, val]) => {
            const flag = key.replaceAll(/[A-Z]/gu, ms => `-${ms.toLowerCase()}`);
            return [
                `--${(typeof val === "boolean") && !val ? "no-" : ""}${flag}`,
                typeof val === "boolean" ? "" : val
            ]
        })
        .filter(Boolean);

    const effectiveCookiesPath = cookiesPath ?? cookiesManagerRef?.getCurrentCookiePath();
    const useCookies = effectiveCookiesPath && existsSync(effectiveCookiesPath);
    
    if (useCookies) {
        const tempCookiesPath = effectiveCookiesPath + ".ytdlp-tmp";
        try {
            copyFileSync(effectiveCookiesPath, tempCookiesPath);
            optArgs.push("--cookies", tempCookiesPath);
        } catch {
            optArgs.push("--cookies", effectiveCookiesPath);
        }
    }

    const extractorArgs = cookiesManagerRef?.getExtractorArgs?.();
    if (extractorArgs) {
        optArgs.push("--extractor-args", extractorArgs);
    }

    const now = Date.now();
    if (now - lastArgsLog > 300_000) {
        lastArgsLog = now;
        const shortUrl = url?.substring(0, 60);
        const cookies = useCookies ? "yes" : "no";
        console.info(`[yt-dlp] args: url=${shortUrl}, cookies=${cookies}, extractor-args=${extractorArgs ?? "none"}`);
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

export function isBotDetectionError(errorMessage) {
    const lowerError = (errorMessage ?? "").toLowerCase();
    if (lowerError.includes("age-restricted")) return false;
    return (
        lowerError.includes("sign in to confirm you're not a bot") ||
        lowerError.includes("sign in to confirm") ||
        lowerError.includes("please sign in") ||
        lowerError.includes("http error 429") ||
        lowerError.includes("error 429") ||
        lowerError.includes("too many requests") ||
        (lowerError.includes("this video is unavailable") && lowerError.includes("429")) ||
        lowerError.includes("login required")
    );
}

export function isAgeRestrictedError(errorMessage) {
    const lowerError = (errorMessage ?? "").toLowerCase();
    if (lowerError.includes("age restricted content")) return true;
    return (
        lowerError.includes("age-restricted") &&
        (lowerError.includes("sign in") || lowerError.includes("confirm"))
    );
}

export async function downloadExecutable() {
    let needsDownload = !existsSync(exePath);

    if (!needsDownload) {
        try {
            const stat = statSync(exePath);
            const ageMs = Date.now() - stat.mtimeMs;
            if (ageMs > UPDATE_INTERVAL_MS) {
                console.info(`[INFO] Yt-dlp binary is ${Math.floor(ageMs / 3_600_000)} hours old, checking for updates...`);
                needsDownload = true;
            }
        } catch {
            needsDownload = true;
        }
    }

    if (needsDownload) {
        const isUpdate = existsSync(exePath);
        console.info(`[INFO] ${isUpdate ? "Updating" : "Downloading"} yt-dlp...`);
        try {
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
            console.info(`[INFO] Yt-dlp ${isUpdate ? "updated" : "downloaded"} (release: ${release.tag_name}).`);
        } catch (err) {
            if (isUpdate) {
                console.warn(`[WARN] Yt-dlp update failed, using existing binary: ${err.message}`);
            } else {
                throw err;
            }
        }
    }

    try {
        const { execFileSync } = await import("node:child_process");
        const version = execFileSync(exePath, ["--version"], { timeout: 5000 }).toString().trim();
        console.info(`[INFO] Using yt-dlp version: ${version}`);
    } catch {
        // Ignore version check errors
    }

}

export const exec = (url, options = {}, spawnOptions = {}, cookiesPath = null) => spawn(exePath, args(url, options, cookiesPath), {
    windowsHide: true,
    ...spawnOptions
});

export default async function ytdl(url, options = {}, spawnOptions = {}, cookiesPath = null) {
    const result = await ytdlOnce(url, options, spawnOptions, cookiesPath);
    return result;
}

async function ytdlOnce(url, options = {}, spawnOptions = {}, cookiesPath = null) {
    const proc = exec(url, options, { ...spawnOptions, stdio: ["ignore", "pipe", "pipe"] }, cookiesPath);
    let data = "";
    let stderrData = "";

    await new Promise((resolve, reject) => {
        if (proc.stderr) {
            proc.stderr.on("data", (chunk) => {
                stderrData += chunk.toString();
            });
        }

        proc.on("error", reject)
            .on("close", (code) => {
                if (code !== 0 && stderrData && isBotDetectionError(stderrData)) {
                    reject(new Error(`Sign in to confirm you're not a bot. URL: ${url}`));
                    return;
                }
                if (code !== 0 && stderrData && isAgeRestrictedError(stderrData)) {
                    reject(new Error("Age restricted content."));
                    return;
                }
                if (code !== 0) {
                    reject(new Error(`yt-dlp process exited with code ${code}: ${stderrData}`));
                    return;
                }
                resolve(code);
            })
            .stdout.on("data", (chunk) => (data += chunk));
    });
    return json(data);
}
