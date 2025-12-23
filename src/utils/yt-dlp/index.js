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

const youtubeCookiesPath = process.env.YOUTUBE_COOKIES ?? "";
const YOUTUBE_HOSTNAME_PATTERN = /(?:youtube\.com|youtu\.be|music\.youtube\.com)/i;

// Check if URL is a YouTube URL
function isYouTubeUrl(url) {
    try {
        const urlObj = new URL(url);
        return YOUTUBE_HOSTNAME_PATTERN.test(urlObj.hostname);
    } catch {
        return false;
    }
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

    // For YouTube URLs, use android_sdkless client which doesn't require PO Token/cookies
    // This allows cookie-less operation for most videos
    if (isYouTubeUrl(url)) {
        // Only use cookies if explicitly provided and file exists
        if (youtubeCookiesPath && existsSync(youtubeCookiesPath)) {
            optArgs.push("--cookies", youtubeCookiesPath);
        } else {
            // Use android_sdkless client which works without cookies
            // This client doesn't require PO Token for format downloads
            optArgs.push("--extractor-args", "youtube:player_client=android_sdkless,web");
        }
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
