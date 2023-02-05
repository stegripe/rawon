import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { spawn } from "node:child_process";
import { resolve } from "node:path";
import got from "got";

const suffix = process.platform === "win32" ? ".exe" : (
    process.platform === "darwin" ? "_macos" : ""
);
const filename = `yt-dlp${suffix}`;
const scriptsPath = resolve(process.cwd(), "scripts");
const exePath = resolve(scriptsPath, filename);

function args(url, options) {
    const optArgs = Object.entries(options)
        .map(([k, v]) => {
            const flag = k.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
            return [
                `--${(typeof v === "boolean") && !v ? "no-" : ""}${flag}`,
                typeof v === "boolean" ? "" : v
            ]
        })
        .flat()
        .filter(Boolean);

    return [url].concat(optArgs);
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
        const asset = release.assets.find((asset) => asset.name === filename);
        await new Promise((resolve, reject) => {
            got.get(asset.browser_download_url).buffer().then(x => {
                mkdirSync(scriptsPath, { recursive: true });
                writeFileSync(exePath, x, { mode: 0o777 });
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
