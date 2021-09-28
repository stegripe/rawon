const { execSync } = require("child_process");
const { existsSync } = require("fs");
const { resolve } = require("path");
const { Server } = require("https");
require("dotenv/config");

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

if (isReplit && (Number(process.versions.node.split(".")[0]) < 16)) {
    console.info("[INFO] This repl doesn't use Node.js v16 or newer, trying to install Node.js v16...");
    execSync(`npm i --save-dev node@16.6.1 && npm config set prefix=$(pwd)/node_modules/node && export PATH=$(pwd)/node_modules/node/bin:$PATH`);
    console.info("[INFO] Node.js v16 has installed, please re-run the bot.");
    process.exit(0);
}

if (isGlitch || isReplit) {
    new Server((req, res) => {
        const now = new Date().toLocaleString("en-US");
        res.end(`OK (200) - ${now}`);
    }).listen(process.env.PORT || 3000);
    console.info(`[INFO] ${isGlitch ? "Glitch" : "Repl"} environment detected, trying to compile...`);
    execSync(`${resolve(process.cwd(), "node_modules", "typescript", "bin", "tsc")} --build tsconfig.json`);
    console.info("[INFO] Compiled, starting the bot...");
}

(async () => {
    const isUnix = ['aix', 'android', 'darwin', 'freebsd', 'linux', 'openbsd', 'sunos'].includes(process.platform.toLowerCase());
    process.env.YOUTUBE_DL_HOST = "https://api.github.com/repos/yt-dlp/yt-dlp/releases?per_page=1";
    process.env.YOUTUBE_DL_FILENAME = "yt-dlp";

    if (!existsSync(resolve(__dirname, "node_modules", "youtube-dl-exec", "bin", isUnix ? "yt-dlp" : "yt-dlp.exe"))) {
        console.info("[INFO] Yt-dlp couldn't be found. Downloading...");
        await require("youtube-dl-exec/scripts/postinstall");
        console.info("[INFO] Yt-dlp downloaded");
    }

    require("./dist/src/index.js");
})();
