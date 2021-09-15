const { execSync } = require("child_process");
const { Server } = require("https");
const { resolve } = require("path");
require("dotenv/config");

const isGlitch = (
    process.env.PROJECT_DOMAIN !== undefined &&
    process.env.PROJECT_INVITE_TOKEN !== undefined &&
    process.env.API_SERVER_EXTERNAL !== undefined &&
    process.env.PROJECT_REMIX_CHAIN !== undefined);

if (isGlitch) {
    new Server((req, res) => {
        const now = new Date().toLocaleString("en-US");
        res.end(`OK (200) - ${now}`);
    }).listen(process.env.PORT);
}

function start() {
    if (isGlitch) {
        console.info("[INFO] Glitch environment detected, trying to compile...");
        execSync(`${resolve(process.cwd(), "node_modules", "typescript", "bin", "tsc")} --build tsconfig.json`);
        console.info("[INFO] Compiled, starting the bot...");
    }

    require("./dist/index.js");
}

