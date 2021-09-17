import { ActivityType } from "discord.js";

// NOTE: Remove this when V5 is released. ///////////////////////////////////////////////////////////
if (!process.env.SECRET_DISCORD_TOKEN) process.env.SECRET_DISCORD_TOKEN = process.env.DISCORD_TOKEN;
if (!process.env.SECRET_YT_API_KEY) process.env.SECRET_YT_API_KEY = process.env.YT_API_KEY;
// //////////////////////////////////////////////////////////////////////////////////////////////////

export const prefix = process.env.CONFIG_PREFIX?.replace(/"/g, "") ?? "!"; // Temporary workaround for https://github.com/docker/compose/issues/6951
export const embedColor = process.env.CONFIG_EMBED_COLOR?.toUpperCase() ?? "7289DA";
export const status = {
    type: process.env.CONFIG_STATUS_TYPE?.toUpperCase() as ActivityType | null ?? "LISTENING",
    activity: process.env.CONFIG_STATUS_ACTIVITY ?? "music on {guildsCount} guilds"
};
export const owners: string[] = process.env.CONFIG_OWNERS?.replace(/  +/g, " ").split(/,[ ]?/) ?? [];
export const YouTubeDataRetrievingStrategy = process.env.CONFIG_YOUTUBE_DATA_STRATEGY?.toLowerCase() as ("scrape" | "api" | undefined) ?? "scrape";
export const disableInviteCmd = process.env.CONFIG_DISABLE_INVITE_CMD?.toLowerCase() === "yes";
export const defaultVolume = Number(process.env.CONFIG_DEFAULT_VOLUME) || 50;
export const maxVolume = Number(process.env.CONFIG_MAX_VOLUME) || 100;
export const disableSongSelection = process.env.CONFIG_DISABLE_SONG_SELECTION?.toLowerCase() === "yes";
export const searchMaxResults = Number(process.env.CONFIG_SEARCH_MAX_RESULTS) || 10;
export const selectTimeout = Number(process.env.CONFIG_SELECT_TIMEOUT) * 1000 || 20 * 1000;
export const allowDuplicate: boolean = process.env.CONFIG_ALLOW_DUPLICATE?.toLowerCase() === "yes";
export const cacheYoutubeDownloads: boolean = process.env.CONFIG_CACHE_YOUTUBE_DOWNLOADS?.toLowerCase() === "yes";
export const cacheMaxLengthAllowed = Number(process.env.CONFIG_CACHE_MAX_LENGTH) || 5400;
export const deleteQueueTimeout = Number(process.env.CONFIG_DELETE_QUEUE_TIMEOUT) * 1000 || 180 * 1000;
export const totalShards: string | number = process.env.CONFIG_TOTALSHARDS?.toLowerCase() ?? "auto";
export const fetchAllUsers = process.env.CONFIG_FETCH_ALL_USERS?.toLowerCase() === "yes";
export const debug = process.env.CONFIG_DEBUG?.toLowerCase() === "yes";

if (searchMaxResults < 1) throw new Error("CONFIG_SEARCH_MAX_RESULTS cannot be smaller than 1");
if (searchMaxResults > 10) throw new Error("CONFIG_SEARCH_MAX_RESULTS cannot be higher than 10");
if (totalShards !== "auto" && isNaN(totalShards as unknown as number)) throw new Error("CONFIG_TOTALSHARDS must be a number or \"auto\"");
if (!["scrape", "api"].includes(YouTubeDataRetrievingStrategy)) throw new Error("CONFIG_YOUTUBE_DATA_STRATEGY must be scrape or api");
