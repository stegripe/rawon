import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { type PresenceStatusData } from "discord.js";
import { parse } from "dotenv";
import { type EnvActivityTypes, type PresenceData } from "../typings/index.js";
import { parseEnvValue } from "../utils/functions/parseEnvValue.js";

const envFiles = ["dev.env", ".env"];

const existingToken = process.env.DISCORD_TOKEN;
for (const envFile of envFiles) {
    const envPath = path.resolve(process.cwd(), envFile);
    if (existsSync(envPath)) {
        const parsed = parse(readFileSync(envPath));
        for (const [key, val] of Object.entries(parsed)) {
            if (key === "DISCORD_TOKEN" && existingToken && !existingToken.includes(",")) {
                continue;
            }
            process.env[key] = val;
        }
    }
}

if (existingToken && !process.env.DISCORD_TOKEN?.includes(",")) {
    process.env.DISCORD_TOKEN = existingToken;
}

const toCapitalCase = (text: string): string => {
    if (text === "") {
        return "";
    }
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

const formatLocale = (locale: string | undefined): string => {
    if ((locale?.length ?? 0) === 0) {
        return "en-US";
    }
    const parts = locale?.toLowerCase().split("-") ?? [];
    if (parts.length === 2) {
        parts[1] = parts[1].toUpperCase();
    }
    return parts.join("-");
};

const rawTokens = process.env.DISCORD_TOKEN ?? "";
const hasComma = rawTokens.includes(",");
const tokenArray = hasComma
    ? rawTokens
          .split(",")
          .map((t) => t.trim())
          .filter((t) => t.length > 0)
    : rawTokens.trim().length > 0
      ? [rawTokens.trim()]
      : [];

export const discordTokens: string[] = tokenArray;
export const discordToken = tokenArray[0] ?? "";
export const isMultiBot = tokenArray.length > 1 && hasComma;

export const rawonLicenseKey = process.env.STEGRIPE_API_LICENSE_KEY?.trim() ?? "";

export const clientId = process.env.SPOTIFY_CLIENT_ID ?? "";
export const clientSecret = process.env.SPOTIFY_CLIENT_SECRET ?? "";

export const stegripeApiLyricsToken = process.env.STEGRIPE_API_LYRICS_TOKEN ?? "";

const computedIsDev = process.env.NODE_ENV?.toLowerCase() === "development";
export const isDev = computedIsDev;
export const isProd = !computedIsDev;

export const mainPrefix = isDev ? "d!" : (process.env.MAIN_PREFIX ?? "") || "!";
export const mainServer = parseEnvValue(process.env.MAIN_SERVER ?? "");
export const devs: string[] = parseEnvValue(process.env.DEVS ?? "");
export const lang = formatLocale(process.env.LOCALE) || "en-US";

const validStatuses = new Set<string>(["online", "idle", "dnd", "invisible"]);

const parsedStatuses = parseEnvValue(process.env.STATUS ?? "")
    .map((status) => status.trim().toLowerCase())
    .filter((status): status is PresenceStatusData => validStatuses.has(status));

const rawPresenceInterval = Number(process.env.PRESENCE_INTERVAL);

export const presenceData: PresenceData = {
    activities: parseEnvValue(process.env.ACTIVITIES ?? "").map((x, i) => ({
        name: x,
        type: (toCapitalCase(parseEnvValue(process.env.ACTIVITY_TYPES ?? "")[i] ?? "") ||
            "Playing") as EnvActivityTypes,
    })),
    status: parsedStatuses.length > 0 ? parsedStatuses : ["online"],
    // An unset var in Docker arrives as "", and Number("") is 0 — the floor check is what rejects it.
    interval:
        Number.isFinite(rawPresenceInterval) && rawPresenceInterval >= 15_000
            ? rawPresenceInterval
            : 60_000,
};

export const enablePrefix = process.env.ENABLE_PREFIX?.toLowerCase() !== "no";
export const enableSlashCommand = process.env.ENABLE_SLASH_COMMAND?.toLowerCase() !== "no";
export const enableSharding = process.env.ENABLE_SHARDING?.toLowerCase() === "yes";

const rawDevtoolsPort = Number(process.env.DEVTOOLS_PORT);
export const devtoolsPort =
    Number.isFinite(rawDevtoolsPort) && rawDevtoolsPort > 0 ? rawDevtoolsPort : 3000;

export const debugMode = process.env.DEBUG_MODE?.toLowerCase() === "yes";

export const stegripeApiUrl = process.env.STEGRIPE_API_URL?.trim() || "https://api.stegripe.org";
