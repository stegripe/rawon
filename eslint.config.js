import nodePath from "node:path";
import { fileURLToPath } from "node:url";
import { includeIgnoreFile } from "@eslint/compat";
import { common, modules, node, prettier, typescript, extend, ignores } from "@stegripe/eslint-config";

const gitIgnore = nodePath.resolve(fileURLToPath(import.meta.url), "..", ".gitignore");

export default [...common, ...modules, ...node, ...prettier, ...extend(typescript, [{
    rule: "typescript/no-unnecessary-condition",
    option: ["off"]
}], ...ignores), includeIgnoreFile(gitIgnore), {
    ignores: [
        "yt-dlp-utils/*",
        "play-dl-importer/*"
    ]
}];
