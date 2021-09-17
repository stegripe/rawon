const { execSync } = require("child_process");
const http = require("http");

const isThisGlitch = (
    process.env.PROJECT_DOMAIN !== undefined &&
    process.env.PROJECT_INVITE_TOKEN !== undefined &&
    process.env.API_SERVER_EXTERNAL !== undefined &&
    process.env.PROJECT_REMIX_CHAIN !== undefined);

if (isThisGlitch) {
    http.createServer((req, res) => {
        const now = new Date().toLocaleString("en-US");
        res.end(`OK (200) - ${now}`);
    }).listen(process.env.PORT);

    setInterval(() => {
        http.get(`http://${process.env.PROJECT_DOMAIN}.glitch.me/`);
    }, 280000);
}

start(isThisGlitch);

function start(glitch = false) {
    if (glitch) {
        console.info("[INFO] Glitch environment detected, trying to compile...");
        execSync("npm run compile");
        console.info("[INFO] Compiled, starting the bot...");
        if (process.env.CONFIG_CACHE_YOUTUBE_DOWNLOADS === "yes") console.warn("[WARN] Using cache on Glitch environment is not recommended, it will eat the project storage drastically.");
    }
    require("./dist/main.js");
}
