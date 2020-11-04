import type { ActivityType } from "discord.js";

export const name: string = process.env.CONFIG_NAME ?? "Disc 11";
export const prefix = process.env.CONFIG_PREFIX?.replace(/"/g, "") ?? "!"; // Temporary workaround for https://github.com/docker/compose/issues/6951
export const embedColor = process.env.CONFIG_EMBED_COLOR ?? "7289DA";
export const owners: string[] = process.env.CONFIG_OWNERS?.replace(/  +/g, " ").split(/,[ ]?/) ?? [];
export const totalShards: string | number = process.env.CONFIG_TOTALSHARDS ?? "auto";
export const defaultVolume = Number(process.env.CONFIG_DEFAULT_VOLUME) || 50;
export const maxVolume = Number(process.env.CONFIG_MAX_VOLUME) || 100;
export const allowDuplicate: boolean = process.env.CONFIG_ALLOW_DUPLICATE === "yes";
export const deleteQueueTimeout = Number(process.env.CONFIG_DELETE_QUEUE_TIMEOUT) * 1000 || 180 * 1000;
export const cacheYoutubeDownloads: boolean = process.env.CONFIG_CACHE_YOUTUBE_DOWNLOADS === "yes";
export const cacheMaxLengthAllowed = Number(process.env.CONFIG_CACHE_MAX_LENGTH) || 5400;
export const disableInviteCmd = process.env.CONFIG_DISABLE_INVITE_CMD === "yes";
export const debug = process.env.CONFIG_DEBUG === "yes";
export const status = {
    type: process.env.STATUS_TYPE?.toUpperCase() as ActivityType | null ?? "LISTENING",
    activity: process.env.CONFIG_STATUS_ACTIVITY ?? "music on {guildsCount}"
};
export const fetchAllUsers = process.env.CONFIG_FETCH_ALL_USERS === "yes";
