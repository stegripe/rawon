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

// OAuth token getter function - will be set by the bot when OAuth is configured
let oauthTokenGetter = null;

/**
 * Set the OAuth token getter function. This allows the bot to provide
 * OAuth tokens dynamically for auto-renewal.
 * @param {function(): Promise<string|null>} getter - Async function that returns the current OAuth access token
 */
export function setOAuthTokenGetter(getter) {
    oauthTokenGetter = getter;
}

/**
 * Clear the OAuth token getter (used when logging out)
 */
export function clearOAuthTokenGetter() {
    oauthTokenGetter = null;
}

/**
 * Get the current OAuth token if available
 * @returns {Promise<string|null>}
 */
async function getOAuthToken() {
    if (oauthTokenGetter) {
        try {
            return await oauthTokenGetter();
        } catch {
            // OAuth token retrieval failed, fall back to cookies
            // This is expected when OAuth is not configured or token refresh fails
            return null;
        }
    }
    return null;
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

    // Try OAuth token first (auto-renewing), fall back to cookies
    const oauthToken = await getOAuthToken();
    if (oauthToken) {
        optArgs.push("--add-headers", `Authorization:Bearer ${oauthToken}`);
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
