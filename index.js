const { execSync } = require("child_process");
const { existsSync, rmSync } = require("fs");
const { resolve } = require("path");
const { Server } = require("https");

try {
    require("dotenv/config");
} catch (err) {
    console.info("[INFO] It seems dotenv hasn't been installed, trying to re-install all modules...");
    if (existsSync(resolve(process.cwd(), "node_modules"))) rmSync(resolve(process.cwd(), "node_modules"), { recursive: true });
    execSync("npm i --only=prod dotenv");
    console.info("[INFO] dotenv has been installed, trying to retrieve environment data...");
    require("dotenv/config");
    console.info("[INFO] Environment data has been retrieved.");
}

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

if (isGlitch) {
    execSync("npm i --only=prod");
}

if (isReplit) {
    console.warn("[WARN] We haven't added stable support for running this bot using Replit, bugs and errors may come up.");
}

if (isGitHub) {
    console.warn("[WARN] Running this bot using GitHub is not recommended.");
}

if (isReplit && (Number(process.versions.node.split(".")[0]) < 16)) {
    console.info("[INFO] This Replit doesn't use Node.js v16 or newer, trying to install Node.js v16...");
    execSync(`npm i --save-dev node@16.6.1 && npm config set prefix=$(pwd)/node_modules/node && export PATH=$(pwd)/node_modules/node/bin:$PATH`);
    console.info("[INFO] Node.js v16 has been installed, please restart the bot.");
    process.exit(0);
}

if (!isGlitch) {
    console.info("[INFO] This bot is not running on Glitch, trying to install ffmpeg-static...");
    execSync("npm i --no-save ffmpeg-static");
    console.info("[INFO] ffmpeg-static has been installed.");
}

if (isGlitch || isReplit) {
    new Server((req, res) => {
        const now = new Date().toLocaleString("en-US");
        res.end(`OK (200) - ${now}`);
    }).listen(Number(process.env.PORT) || 3000);

    console.info(`[INFO] ${isGlitch ? "Glitch" : "Replit"} environment detected, trying to compile...`);
    execSync(`npm run compile`);
    console.info("[INFO] Compiled.");
}

(async () => {
    const isUnix = ["aix", "android", "darwin", "freebsd", "linux", "openbsd", "sunos"].includes(process.platform.toLowerCase());
    process.env.YOUTUBE_DL_HOST = "https://api.github.com/repos/yt-dlp/yt-dlp/releases?per_page=1";
    process.env.YOUTUBE_DL_FILENAME = "yt-dlp";

    const ytdlBinaryDir = resolve(__dirname, "node_modules", "youtube-dl-exec", "bin")
    if (!existsSync(resolve(ytdlBinaryDir, isUnix ? "yt-dlp" : "yt-dlp.exe"))) {
        console.info("[INFO] Yt-dlp couldn't be found, trying to download...");
        if (existsSync(resolve(ytdlBinaryDir, isUnix ? "youtube-dl" : "youtube-dl.exe"))) rmSync(resolve(ytdlBinaryDir, isUnix ? "youtube-dl" : "youtube-dl.exe"));
        await require("youtube-dl-exec/scripts/postinstall");
        console.info("[INFO] Yt-dlp has been downloaded.");
    }

    console.info("[INFO] Starting the bot...");
    require("./dist/index.js");
})();
