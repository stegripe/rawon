import { EnvActivityTypes, PresenceData } from "../typings/index.js";
import { parseEnvValue } from "../utils/functions/parseEnvValue.js";
import { existsSync, readFileSync } from "node:fs";
import { ClientPresenceStatus } from "discord.js";
import { resolve } from "node:path";
import { parse } from "dotenv";

const devEnvPath = resolve(process.cwd(), "dev.env");
if (existsSync(devEnvPath)) {
    const parsed = parse(readFileSync(devEnvPath));
    for (const [k, v] of Object.entries(parsed)) {
        process.env[k] = v;
    }
}

const toCapitalCase = (text: string): string => {
    if (text === "") return "";
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

const formatLocale = (locale: string | undefined): string => {
    if (!locale) return "en";
    const parts = locale.toLowerCase().split('-');
    if (parts.length === 2) {
        parts[1] = parts[1].toUpperCase();
    }
    return parts.join('-');
};

export const stayInVCAfterFinished = process.env.STAY_IN_VC_AFTER_FINISHED?.toLowerCase() === "yes";
export const enableSlashCommand = process.env.ENABLE_SLASH_COMMAND?.toLowerCase() !== "no";
export const is247Allowed = process.env.ENABLE_24_7_COMMAND?.toLowerCase() === "yes";
export const isDev = process.env.NODE_ENV?.toLowerCase() === "development";
export const debugMode = process.env.DEBUG_MODE?.toLowerCase() === "yes";
export const enableRepl = process.env.REPL?.toLowerCase() === "yes";
export const isProd = !isDev;

export const musicSelectionType = (process.env.MUSIC_SELECTION_TYPE?.toLowerCase() ?? "") || "message";
export const embedColor = (process.env.EMBED_COLOR?.toUpperCase() ?? "") || "00AD95";
export const streamStrategy = process.env.STREAM_STRATEGY! || "yt-dlp";
export const mainPrefix = isDev ? "d!" : process.env.MAIN_PREFIX! || "!";
export const lang = formatLocale(process.env.LOCALE) || "en";
export const yesEmoji = process.env.YES_EMOJI! || "✅";
export const noEmoji = process.env.NO_EMOJI! || "❌";

export const altPrefixes: string[] = parseEnvValue(process.env.ALT_PREFIX! || "{mention}").filter(
    (x, i, a) => a.indexOf(x) === i && x !== mainPrefix
);
export const devs: string[] = parseEnvValue(process.env.DEVS ?? "");
export const mainGuild = parseEnvValue(process.env.MAIN_GUILD ?? "");
export const presenceData: PresenceData = {
    activities: parseEnvValue(process.env.ACTIVITIES ?? "").map((x, i) => ({
        name: x,
        type: (toCapitalCase(parseEnvValue(process.env.ACTIVITY_TYPES ?? "")[i]) || "Playing") as EnvActivityTypes
    })),
    status: ["online"] as ClientPresenceStatus[],
    interval: 60000
};
