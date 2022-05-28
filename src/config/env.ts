import { parseEnvValue } from "../utils/functions/parseEnvValue";
import { PresenceData } from "../typings";
import { ActivityType, ClientPresenceStatus } from "discord.js";
import { existsSync, readFileSync } from "fs";
import { resolve } from "path";
import { parse } from "dotenv";

// Parse the dev.env file
const devEnvPath = resolve(process.cwd(), "dev.env");
if (existsSync(devEnvPath)) {
    const parsed = parse(readFileSync(devEnvPath));
    for (const [k, v] of Object.entries(parsed)) {
        process.env[k] = v;
    }
}

// Boolean values
export const stayInVCAfterFinished = process.env.STAY_IN_VC_AFTER_FINISHED?.toLowerCase() === "yes";
export const enableSlashCommand = process.env.ENABLE_SLASH_COMMAND?.toLowerCase() !== "no";
export const is247Allowed = process.env.ENABLE_24_7_COMMAND?.toLowerCase() === "yes";
export const isDev = process.env.NODE_ENV?.toLowerCase() === "development";
export const debugMode = process.env.DEBUG_MODE?.toLowerCase() === "yes";
export const enableRepl = process.env.REPL?.toLowerCase() === "yes";
export const isProd = !isDev;

// String values
export const musicSelectionType = (process.env.MUSIC_SELECTION_TYPE?.toLowerCase() ?? "") || "message";
export const embedColor = (process.env.EMBED_COLOR?.toUpperCase() ?? "") || "22C9FF";
export const streamStrategy = process.env.STREAM_STRATEGY! || "yt-dlp";
export const mainPrefix = isDev ? "d!" : process.env.MAIN_PREFIX! || "!";
export const lang = (process.env.LOCALE?.toLowerCase() ?? "") || "en";
export const yesEmoji = process.env.YES_EMOJI! || "✅";
export const noEmoji = process.env.NO_EMOJI! || "❌";

// Multiple values
export const altPrefixes: string[] = parseEnvValue(process.env.ALT_PREFIX! || "{mention}").filter(
    (x, i, a) => a.indexOf(x) === i && x !== mainPrefix
);
export const devs: string[] = parseEnvValue(process.env.DEVS ?? "");
export const mainGuild = parseEnvValue(process.env.MAIN_GUILD ?? "");
export const presenceData: PresenceData = {
    activities: parseEnvValue(process.env.ACTIVITIES ?? "").map((x, i) => ({
        name: x,
        type: (parseEnvValue(process.env.ACTIVITY_TYPES ?? "")[i]?.toUpperCase() || "PLAYING") as Exclude<
            ActivityType,
            "CUSTOM"
        >
    })),
    status: ["online"] as ClientPresenceStatus[],
    interval: 60000
};
