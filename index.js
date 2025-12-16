/* eslint-disable node/no-sync */
import { execSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import nodePath from "node:path";
import process from "node:process";
import got from "got";
import prism from "prism-media";
import { extract } from "zip-lib";
import { downloadExecutable } from "./yt-dlp-utils/index.js";

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

const streamStrategy = process.env.STREAM_STRATEGY;
if (streamStrategy !== "play-dl") await downloadExecutable();
if (streamStrategy === "play-dl" && !existsSync(nodePath.resolve(process.cwd(), "play-dl-fix"))) {
    console.log("[INFO] Downloading play-dl fix...");
    writeFileSync(
        nodePath.resolve(process.cwd(), "temp.zip"),
        await got.get("https://github.com/YuzuZensai/play-dl-test/archive/2bfbfe6decd68261747ba55800319f9906f12b03.zip").buffer(),
        { mode: 0o777 }
    );

    console.log("[INFO] Extracting play-dl fix...");
    mkdirSync(nodePath.resolve(process.cwd(), "play-dl-fix"), { recursive: true });
    await extract(nodePath.resolve(process.cwd(), "temp.zip"), nodePath.resolve(process.cwd(), "play-dl-fix"), { overwrite: true });

    const dirs = readdirSync(nodePath.resolve(process.cwd(), "play-dl-fix"));
    cpSync(nodePath.resolve(process.cwd(), "play-dl-fix", dirs[0]), nodePath.resolve(process.cwd(), "play-dl-fix"), { force: true, recursive: true });
    rmSync(nodePath.resolve(process.cwd(), "play-dl-fix", dirs[0]), { force: true, recursive: true });
    rmSync(nodePath.resolve(process.cwd(), "temp.zip"), { force: true });

    console.log("[INFO] Installing packages for play-dl...");
    execSync("cd play-dl-fix && pnpm install");

    console.log("[INFO] Compiling play-dl...");
    execSync("cd play-dl-fix && pnpm run build");
}
console.info("[INFO] Starting the bot...");

import("./dist/index.js");
