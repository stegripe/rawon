import { ActivityType, ClientOptions, ClientPresenceStatus, ColorResolvable, Intents, LimitedCollection, Options, ShardingManagerMode } from "discord.js";

export const clientOptions: ClientOptions = {
    allowedMentions: { parse: ["users"], repliedUser: true },
    intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_EMOJIS_AND_STICKERS, Intents.FLAGS.GUILD_EMOJIS_AND_STICKERS],
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
export const defaultPrefix = process.env.CONFIG_PREFIX?.replace(/"/g, "") ?? "!";
export const owners: string[] = process.env.CONFIG_OWNERS?.replace(/  +/g, " ").split(/,[ ]?/) ?? [];
export const embedColor = process.env.CONFIG_EMBED_COLOR?.toUpperCase() ?? "3CAAFF" as ColorResolvable;
export const devGuild = JSON.parse(process.env.CONFIG_DEV_GUILD!);
export const isProd = process.env.NODE_ENV === "production";
export const isDev = !isProd;
export const prefix = isDev ? "d!" : defaultPrefix;
interface IpresenceData {
    activities: { name: string; type: ActivityType }[];
    status: ClientPresenceStatus[];
    interval: number;
}
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
export const shardsCount: number | "auto" = "auto";
export const shardingMode: ShardingManagerMode = "worker";
