import { lang } from "./env";
import { ClientOptions, Intents, Options, ShardingManagerMode, Sweepers } from "discord.js";
import { join } from "path";
import i18n from "i18n";

export const clientOptions: ClientOptions = {
    allowedMentions: { parse: ["users"], repliedUser: true },
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.GUILD_EMOJIS_AND_STICKERS,
        Intents.FLAGS.GUILD_VOICE_STATES,
        Intents.FLAGS.GUILD_BANS
    ],
    makeCache: Options.cacheWithLimits({
        MessageManager: {
            maxSize: Infinity,
            sweepInterval: 300,
            sweepFilter: Sweepers.filterByLifetime({
                lifetime: 10800
            })
        },
        ThreadManager: {
            maxSize: Infinity,
            sweepInterval: 300,
            sweepFilter: Sweepers.filterByLifetime({
                lifetime: 10800,
                getComparisonTimestamp: e => e.archiveTimestamp!,
                excludeFromSweep: e => !e.archived
            })
        }
    }),
    retryLimit: 3
};

i18n.configure({
    defaultLocale: "en",
    directory: join(process.cwd(), "lang"),
    locales: ["en", "es", "id", "fr"],
    objectNotation: true
});

i18n.setLocale(lang);

export const shardsCount: number | "auto" = "auto";
export const shardingMode: ShardingManagerMode = "worker";
export * from "./env";
export default i18n;
