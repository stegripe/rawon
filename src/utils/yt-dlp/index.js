import { spawn } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import nodePath from "node:path";
import process from "node:process";
import got from "got";
import { oauthManager } from "../handlers/OAuthManager.js";

const suffix = process.platform === "win32" ? ".exe" : (
    process.platform === "darwin" ? "_macos" : ""
);
const filename = `yt-dlp${suffix}`;
const scriptsPath = nodePath.resolve(process.cwd(), "cache", "scripts");
const exePath = nodePath.resolve(scriptsPath, filename);

const youtubeCookiesPath = process.env.YOUTUBE_COOKIES ?? "";

/**
 * Build arguments for yt-dlp command
 * @param {string} url - The URL to process
 * @param {object} options - yt-dlp options
 * @param {string|null} accessToken - OAuth access token (optional)
 * @returns {string[]} Command arguments
 */
function args(url, options, accessToken = null) {
    const optArgs = Object.entries(options)
        .flatMap(([key, val]) => {
            const flag = key.replaceAll(/[A-Z]/gu, ms => `-${ms.toLowerCase()}`);
            return [
                `--${(typeof val === "boolean") && !val ? "no-" : ""}${flag}`,
                typeof val === "boolean" ? "" : val
            ]
        })
        .filter(Boolean);

    // Use OAuth token if available, otherwise fall back to cookies
    if (accessToken) {
        optArgs.push("--username", "oauth2", "--password", accessToken);
    } else if (youtubeCookiesPath && existsSync(youtubeCookiesPath)) {
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

/**
 * Execute yt-dlp with OAuth support
 * This version gets the OAuth access token if available
 * @param {string} url - The URL to process
 * @param {object} options - yt-dlp options
 * @param {object} spawnOptions - Node spawn options
 * @returns {import("node:child_process").ChildProcess}
 */
export const execWithOAuth = async (url, options = {}, spawnOptions = {}) => {
    const accessToken = await oauthManager.getAccessToken();
    return spawn(exePath, args(url, options, accessToken), {
        windowsHide: true,
        ...spawnOptions
    });
};

export default async function ytdl(url, options = {}, spawnOptions = {}) {
    const accessToken = await oauthManager.getAccessToken();
    const proc = spawn(exePath, args(url, options, accessToken), {
        windowsHide: true,
        ...spawnOptions
    });
    let data = "";

    await new Promise((resolve, reject) => {
        proc.on("error", reject)
            .on("close", resolve)
            .stdout.on("data", (chunk) => (data += chunk));
    });
    return json(data);
}
