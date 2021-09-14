import { ActivityType, ClientOptions, ClientPresenceStatus, ColorResolvable, Intents, LimitedCollection, Options, ShardingManagerMode, UserResolvable } from "discord.js";

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
export const defaultPrefix = "!";
export const devs: UserResolvable[] = ["319872685897416725"];
export const embedColor = "3CAAFF" as ColorResolvable;
export const devGuild = JSON.parse(process.env.DEV_GUILD!);
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
        { name: "with {users.size} of users", type: "PLAYING" },
        { name: "{textChannels.size} of text channels in {guilds.size} guilds", type: "WATCHING" },
        { name: "Hello there, my name is {username}", type: "PLAYING" },
        { name: "Hello world", type: "COMPETING" }
    ],
    status: ["online"] as ClientPresenceStatus[],
    interval: 60000
};
export const shardsCount: number | "auto" = "auto";
export const shardingMode: ShardingManagerMode = "worker";
