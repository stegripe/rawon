import { IpresenceData } from "./typings";
import { ClientOptions, ClientPresenceStatus, Intents, LimitedCollection, Options, ShardingManagerMode } from "discord.js";

export const clientOptions: ClientOptions = {
    allowedMentions: { parse: ["users"], repliedUser: true },
    intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_EMOJIS_AND_STICKERS, Intents.FLAGS.GUILD_VOICE_STATES, Intents.FLAGS.GUILD_BANS],
    makeCache: Options.cacheWithLimits({
        MessageManager: {
            maxSize: Infinity,
            sweepInterval: 300,
            sweepFilter: LimitedCollection.filterByLifetime({
                lifetime: 10800
            })
        },
        ThreadManager: {
            maxSize: Infinity,
            sweepInterval: 300,
            sweepFilter: LimitedCollection.filterByLifetime({
                lifetime: 10800,
                getComparisonTimestamp: e => e.archiveTimestamp!,
                excludeFromSweep: e => !e.archived
            })
        }
    }),
    retryLimit: 3
};
export const shardsCount: number | "auto" = "auto";
export const shardingMode: ShardingManagerMode = "worker";
export const defaultPrefix = process.env.PREFIX?.replace(/"/g, "") ?? "!";
export const owners: string[] = JSON.parse(process.env.OWNERS ?? "[]");
export const embedColor = process.env.EMBED_COLOR?.toUpperCase() ?? "3CAAFF";
export const devGuild = JSON.parse(process.env.DEV_GUILD ?? "[]");
export const isProd = process.env.NODE_ENV === "production";
export const isDev = !isProd;
export const prefix = isDev ? "d!" : defaultPrefix;
export const musicSelectionType = process.env.MUSIC_SELECTION_TYPE?.toLowerCase() as string || "message";
export const is247Allowed = process.env.ENABLE_24_7_COMMAND?.toLowerCase() === "yes";
export const stayInVCAfterFinished = process.env.STAY_IN_VC_AFTER_FINISHED?.toLowerCase() === "yes";
export const yesEmoji = process.env.YES_EMOJI ?? "✅";
export const noEmoji = process.env.NO_EMOJI ?? "❌";
export const djRoleName = process.env.DJ_ROLE_NAME! || "DJ";
export const muteRoleName = process.env.MUTE_ROLE_NAME! || "Muted";
export const presenceData: IpresenceData = {
    activities: [
        { name: `My default prefix is ${prefix}`, type: "PLAYING" },
        { name: "music with {users.size} users", type: "LISTENING" },
        { name: "{textChannels.size} of text channels in {guilds.size} guilds", type: "WATCHING" },
        { name: "Hello there, my name is {username}", type: "PLAYING" },
        { name: "Hello world", type: "COMPETING" }
    ],
    status: ["online"] as ClientPresenceStatus[],
    interval: 60000
};
