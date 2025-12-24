import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { type ClientPresenceStatus } from "discord.js";
import { parse } from "dotenv";
import { type EnvActivityTypes, type PresenceData } from "../typings/index.js";
import { parseEnvValue } from "../utils/functions/parseEnvValue.js";

const envFiles = ["dev.env", "optional.env", ".env"];
for (const envFile of envFiles) {
    const envPath = path.resolve(process.cwd(), envFile);
    if (existsSync(envPath)) {
        const parsed = parse(readFileSync(envPath));
        for (const [key, val] of Object.entries(parsed)) {
            process.env[key] = val;
        }
    }
}

const toCapitalCase = (text: string): string => {
    if (text === "") {
        return "";
    }
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

const formatLocale = (locale: string | undefined): string => {
    if ((locale?.length ?? 0) === 0) {
        return "en";
    }
    const parts = locale?.toLowerCase().split("-") ?? [];
    if (parts.length === 2) {
        parts[1] = parts[1].toUpperCase();
    }
    return parts.join("-");
};
export const clientId = process.env.SPOTIFY_CLIENT_ID ?? "";
export const clientSecret = process.env.SPOTIFY_CLIENT_SECRET ?? "";

export const embedColor = (process.env.EMBED_COLOR?.toUpperCase() ?? "") || "22C9FF";
export const lang = formatLocale(process.env.LOCALE) || "en";
export const mainServer = parseEnvValue(process.env.MAIN_SERVER ?? "");
export const enablePrefix = process.env.ENABLE_PREFIX?.toLowerCase() !== "no";
export const enableSlashCommand = process.env.ENABLE_SLASH_COMMAND?.toLowerCase() !== "no";
export const enableAudioCache = process.env.ENABLE_AUDIO_CACHE?.toLowerCase() === "yes";
export const musicSelectionType =
    (process.env.MUSIC_SELECTION_TYPE?.toLowerCase() ?? "") || "message";
export const yesEmoji = (process.env.YES_EMOJI ?? "") || "✅";
export const noEmoji = (process.env.NO_EMOJI ?? "") || "❌";
export const requestChannelSplash =
    (process.env.REQUEST_CHANNEL_SPLASH ?? "") ||
    "https://cdn.stegripe.org/images/rawon_splash.png";

export const devs: string[] = parseEnvValue(process.env.DEVS ?? "");
export const isDev = process.env.NODE_ENV?.toLowerCase() === "development";
export const isProd = !isDev;
export const mainPrefix = isDev ? "d!" : (process.env.MAIN_PREFIX ?? "") || "!";
export const debugMode = process.env.DEBUG_MODE?.toLowerCase() === "yes";

export const altPrefixes: string[] = parseEnvValue(
    (process.env.ALT_PREFIX ?? "") || "{mention}",
).filter((x, i, a) => a.indexOf(x) === i && x !== mainPrefix);
export const presenceData: PresenceData = {
    activities: parseEnvValue(process.env.ACTIVITIES ?? "").map((x, i) => ({
        name: x,
        type: (toCapitalCase(parseEnvValue(process.env.ACTIVITY_TYPES ?? "")[i]) ||
            "Playing") as EnvActivityTypes,
    })),
    status: ["online"] as ClientPresenceStatus[],
    interval: 60_000,
};
