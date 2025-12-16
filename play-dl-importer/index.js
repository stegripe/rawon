import module from "node:module";
import nodePath from "node:path";
import { fileURLToPath } from "node:url";

const require = module.createRequire(nodePath.resolve(fileURLToPath(import.meta.url), ".."));
const mod = require("play-dl");

export default mod;
