import { spawn } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import nodePath from "node:path";
import process from "node:process";
import got from "got";
import { youtubeOAuth } from "../../../dist/utils/handlers/YouTubeOAuthManager.js";

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

async function args(url, options) {
    const optArgs = Object.entries(options)
        .flatMap(([key, val]) => {
            const flag = key.replaceAll(/[A-Z]/gu, ms => `-${ms.toLowerCase()}`);
            return [
                `--${(typeof val === "boolean") && !val ? "no-" : ""}${flag}`,
                typeof val === "boolean" ? "" : val
            ]
        })
        .filter(Boolean);

    // For YouTube URLs, try OAuth first, then fall back to cookies
    if (isYouTubeUrl(url)) {
        // Get access token from OAuth manager (handles caching and refresh internally)
        const accessToken = await youtubeOAuth.getAccessToken();
        if (accessToken) {
            // Use TV client with OAuth token for better compatibility
            console.info("[YouTubeOAuth] Using OAuth token for YouTube request");
            optArgs.push("--extractor-args", "youtube:player_client=tv");
            optArgs.push("--add-headers", `Authorization:Bearer ${accessToken}`);
        } else if (youtubeCookiesPath && existsSync(youtubeCookiesPath)) {
            // Fall back to cookies if no OAuth
            console.info("[YouTubeOAuth] Using cookies file for YouTube request");
            optArgs.push("--cookies", youtubeCookiesPath);
        } else {
            // No authentication available - warn the user
            console.warn("[YouTubeOAuth] No authentication configured! Run 'ytauth setup' command or set YOUTUBE_COOKIES env var. YouTube may block requests.");
        }
    } else if (youtubeCookiesPath && existsSync(youtubeCookiesPath)) {
        // Non-YouTube URLs with cookies
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

export const exec = async (url, options = {}, spawnOptions = {}) => {
    const resolvedArgs = await args(url, options);
    return spawn(exePath, resolvedArgs, {
        windowsHide: true,
        ...spawnOptions
    });
};

export default async function ytdl(url, options = {}, spawnOptions = {}) {
    const proc = await exec(url, options, spawnOptions);
    let data = "";

    await new Promise((resolve, reject) => {
        proc.on("error", reject)
            .on("close", resolve)
            .stdout.on("data", (chunk) => (data += chunk));
    });
    return json(data);
}
