import { downloadExecutable } from "./yt-dlp-utils";
import { execSync } from "child_process";
import { existsSync, rmSync } from "fs";
import { resolve } from "path";
import { Server } from "https";
import module from "module";

const isGlitch = (
    process.env.PROJECT_DOMAIN !== undefined &&
    process.env.PROJECT_INVITE_TOKEN !== undefined &&
    process.env.API_SERVER_EXTERNAL !== undefined &&
    process.env.PROJECT_REMIX_CHAIN !== undefined);

const isReplit = (
    process.env.REPLIT_DB_URL !== undefined &&
    process.env.REPL_ID !== undefined &&
    process.env.REPL_IMAGE !== undefined &&
    process.env.REPL_LANGUAGE !== undefined &&
    process.env.REPL_OWNER !== undefined &&
    process.env.REPL_PUBKEYS !== undefined &&
    process.env.REPL_SLUG !== undefined)

const isGitHub = (
    process.env.GITHUB_ENV !== undefined &&
    process.env.GITHUB_EVENT_PATH !== undefined &&
    process.env.GITHUB_REPOSITORY_OWNER !== undefined &&
    process.env.GITHUB_RETENTION_DAYS !== undefined &&
    process.env.GITHUB_HEAD_REF !== undefined &&
    process.env.GITHUB_GRAPHQL_URL !== undefined &&
    process.env.GITHUB_API_URL !== undefined &&
    process.env.GITHUB_WORKFLOW !== undefined &&
    process.env.GITHUB_RUN_ID !== undefined &&
    process.env.GITHUB_BASE_REF !== undefined &&
    process.env.GITHUB_ACTION_REPOSITORY !== undefined &&
    process.env.GITHUB_ACTION !== undefined &&
    process.env.GITHUB_RUN_NUMBER !== undefined &&
    process.env.GITHUB_REPOSITORY !== undefined &&
    process.env.GITHUB_ACTION_REF !== undefined &&
    process.env.GITHUB_ACTIONS !== undefined &&
    process.env.GITHUB_WORKSPACE !== undefined &&
    process.env.GITHUB_JOB !== undefined &&
    process.env.GITHUB_SHA !== undefined &&
    process.env.GITHUB_RUN_ATTEMPT !== undefined &&
    process.env.GITHUB_REF !== undefined &&
    process.env.GITHUB_ACTOR !== undefined &&
    process.env.GITHUB_PATH !== undefined &&
    process.env.GITHUB_EVENT_NAME !== undefined &&
    process.env.GITHUB_SERVER_URL !== undefined
)

function npmInstall(deleteDir = false, forceInstall = false, additionalArgs = []) {
    if (deleteDir) {
        const modulesPath = resolve(process.cwd(), "node_modules");

        if (existsSync(modulesPath)) {
            rmSync(modulesPath, {
                recursive: true
            });
        }
    }

    execSync(`npm install${isGlitch ? " --only=prod" : ""}${forceInstall ? " --force" : ""} ${additionalArgs.join(" ")}`);
}

if (isGlitch) {
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

if (isReplit) {
    console.warn("[WARN] We haven't added stable support for running this bot using Replit, bugs and errors may come up.");

    if (Number(process.versions.node.split(".")[0]) < 16) {
        console.info("[INFO] This Replit doesn't use Node.js v16 or newer, trying to install Node.js v16...");
        execSync(`npm i --save-dev node@16.6.1 && npm config set prefix=$(pwd)/node_modules/node && export PATH=$(pwd)/node_modules/node/bin:$PATH`);
        console.info("[INFO] Node.js v16 has been installed, please restart the bot.");
        process.exit(0);
    }
}

if (isGitHub) {
    console.warn("[WARN] Running this bot using GitHub is not recommended.");
}

const require = module.createRequire(import.meta.url);

if (!isGlitch) {
    try {
        require("ffmpeg-static");
    } catch {
        console.info("[INFO] This bot is not running on Glitch, trying to install ffmpeg-static...");
        npmInstall(false, false, ["--no-save", "ffmpeg-static"]);
        console.info("[INFO] ffmpeg-static has been installed.");
    }
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
