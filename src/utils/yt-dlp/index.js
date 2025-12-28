import { spawn } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import nodePath from "node:path";
import process from "node:process";
import got from "got";

const suffix = process.platform === "win32" ? ".exe" : (
    process.platform === "darwin" ? "_macos" : ""
);
const filename = `yt-dlp${suffix}`;
const scriptsPath = nodePath.resolve(process.cwd(), "cache", "scripts");
const exePath = nodePath.resolve(scriptsPath, filename);

let cookiesManagerRef = null;

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
    
    if (effectiveCookiesPath && existsSync(effectiveCookiesPath)) {
        optArgs.push("--cookies", effectiveCookiesPath);
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
    return (
        lowerError.includes("sign in to confirm you're not a bot") ||
        lowerError.includes("sign in to confirm") ||
        lowerError.includes("please sign in")
    );
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

export const exec = (url, options = {}, spawnOptions = {}, cookiesPath = null) => spawn(exePath, args(url, options, cookiesPath), {
    windowsHide: true,
    ...spawnOptions
});

export default async function ytdl(url, options = {}, spawnOptions = {}, cookiesPath = null) {
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
