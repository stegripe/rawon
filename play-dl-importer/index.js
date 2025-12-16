import { existsSync } from "node:fs";
import module from "node:module";
import nodePath from "node:path";
import { fileURLToPath } from "node:url";

// eslint-disable-next-line import/no-mutable-exports
let mod;

if (existsSync(nodePath.resolve(fileURLToPath(import.meta.url), "..", "..", "play-dl-fix", "dist", "index.mjs"))) {
    mod = await import("../play-dl-fix/dist/index.mjs");
} else {
    const require = module.createRequire(nodePath.resolve(fileURLToPath(import.meta.url), ".."));
    mod = require("play-dl");
}

export default mod;
