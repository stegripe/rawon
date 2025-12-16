/* eslint-disable node/no-sync */
import { execSync } from "node:child_process";
import { existsSync, rmSync } from "node:fs";
import nodePath from "node:path";
import process from "node:process";
import prism from "prism-media";
import { downloadExecutable } from "./src/utils/yt-dlp/index.js";

const ensureEnv = arr => arr.every(x => process.env[x] !== undefined);

const isGitHub = ensureEnv([
    "GITHUB_ENV",
    "GITHUB_REPOSITORY_OWNER",
    "GITHUB_HEAD_REF",
    "GITHUB_API_URL",
    "GITHUB_REPOSITORY",
    "GITHUB_SERVER_URL"
]);

function npmInstall(deleteDir = false, forceInstall = false, additionalArgs = []) {
    if (deleteDir) {
        const modulesPath = nodePath.resolve(process.cwd(), "node_modules");

        if (existsSync(modulesPath)) {
            rmSync(modulesPath, {
                recursive: true,
                force: true
            });
        }
    }

    execSync(`pnpm install${forceInstall ? " --force" : ""} ${additionalArgs.join(" ")}`);
}

if (isGitHub) {
    console.warn("[WARN] Running this bot using GitHub is not recommended.");
}

try {
    prism.FFmpeg.getInfo(true);
} catch {
    console.info("[INFO] Couldn't find FFmpeg/avconv, trying to install ffmpeg-static...");
    npmInstall(false, false, ["--no-save", "ffmpeg-static"]);
    console.info("[INFO] ffmpeg-static has been installed.");
}

await downloadExecutable();
console.info("[INFO] Starting the bot...");

import("./dist/index.js");
