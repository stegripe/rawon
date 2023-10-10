import { downloadExecutable } from "./yt-dlp-utils";
import { existsSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { execSync } from "node:child_process";
import { resolve } from "node:path";
import { Server } from "node:http";
import module from "node:module";
import prism from "prism-media";

const ensureEnv = arr => arr.every(x => process.env[x] !== undefined);

const isGlitch = ensureEnv([
    "PROJECT_DOMAIN",
    "PROJECT_INVITE_TOKEN",
    "API_SERVER_EXTERNAL",
    "PROJECT_REMIX_CHAIN"
]);

const isReplit = ensureEnv([
    "REPLIT_DB_URL",
    "REPL_ID",
    "REPL_IMAGE",
    "REPL_LANGUAGE",
    "REPL_OWNER",
    "REPL_PUBKEYS",
    "REPL_SLUG"
]);

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
        const modulesPath = resolve(process.cwd(), "node_modules");

        if (existsSync(modulesPath)) {
            rmSync(modulesPath, {
                recursive: true,
                force: true
            });
        }
    }

    execSync(`npm install${isGlitch ? " --only=prod" : ""}${forceInstall ? " --force" : ""} ${additionalArgs.join(" ")}`);
}

if (isGlitch) {
    const gitIgnorePath = resolve(process.cwd(), ".gitignore");
    try {
        const data = readFileSync(gitIgnorePath, "utf8").toString();
        if (data.includes("dev.env")) {
            writeFileSync(gitIgnorePath, data.replace("\ndev.env", ""));
            console.info("Removed dev.env from .gitignore");
        }
    } catch {
        console.error("Failed to remove dev.env from .gitignore");
    }

    try {
        console.info("[INFO] Trying to re-install modules...");
        npmInstall();
        console.info("[INFO] Modules successfully re-installed.");
    } catch (err) {
        console.info("[INFO] Failed to re-install modules, trying to delete node_modules and re-install...");
        try {
            npmInstall(true);
            console.info("[INFO] Modules successfully re-installed.");
        } catch {
            console.info("[INFO] Failed to re-install modules, trying to delete node_modules and install modules forcefully...");
            try {
                npmInstall(true, true);
                console.info("[INFO] Modules successfully re-installed.");
            } catch {
                console.warn("[WARN] Failed to re-install modules, please re-install manually.");
            }
        }
    }
}

if (isGitHub) {
    console.warn("[WARN] Running this bot using GitHub is not recommended.");
}

const require = module.createRequire(import.meta.url);

try {
    prism.FFmpeg.getInfo(true);
} catch {
    console.info("[INFO] Couldn't find FFmpeg/avconv, trying to install ffmpeg-static...");
    npmInstall(false, false, ["--no-save", "ffmpeg-static"]);
    console.info("[INFO] ffmpeg-static has been installed.");
}

if (isGlitch || isReplit) {
    new Server((req, res) => {
        const now = new Date().toLocaleString("en-US");
        res.end(`OK (200) - ${now}`);
    }).listen(Number(process.env.PORT || 3000) || 3000);

    console.info(`[INFO] ${isGlitch ? "Glitch" : "Replit"} environment detected, trying to compile...`);
    execSync(`npm run compile`);
    console.info("[INFO] Compiled.");
}

const streamStrategy = process.env.STREAM_STRATEGY;
if (streamStrategy !== "play-dl") await downloadExecutable();
if (streamStrategy === "play-dl") {
    try {
        require("play-dl");
    } catch {
        console.info("[INFO] Installing play-dl...");
        npmInstall(false, false, ["play-dl"]);
        console.info("[INFO] Play-dl has been installed.");
    }
}
console.info("[INFO] Starting the bot...");

import("./dist/index.js");
