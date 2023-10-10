import { lang } from "./env.js";
import { ClientOptions, IntentsBitField, Options, ShardingManagerMode, Sweepers } from "discord.js";
import { join } from "node:path";
import i18n from "i18n";

export const clientOptions: ClientOptions = {
    allowedMentions: { parse: ["users"], repliedUser: true },
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.MessageContent,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.GuildEmojisAndStickers,
        IntentsBitField.Flags.GuildVoiceStates,
        IntentsBitField.Flags.GuildBans
    ],
    makeCache: Options.cacheWithLimits({
        MessageManager: {
            maxSize: Infinity
        },
        ThreadManager: {
            maxSize: Infinity
        }
    }),
    sweepers: {
        messages: {
            interval: 300,
            filter: Sweepers.filterByLifetime({ lifetime: 10800 })
        },
        threads: {
            interval: 300,
            filter: Sweepers.filterByLifetime({
                lifetime: 10800,
                getComparisonTimestamp: e => e.archiveTimestamp!,
                excludeFromSweep: e => !e.archived
            })
        }
    }
};

i18n.configure({
    defaultLocale: "en",
    directory: join(process.cwd(), "lang"),
    locales: ["en", "es", "id", "fr", "zh-CN", "zh-TW", "uk", "vi", "pt-BR", "ru"],
    objectNotation: true
});

i18n.setLocale(lang);

export const shardsCount: number | "auto" = "auto";
export const shardingMode: ShardingManagerMode = "worker";
export * from "./env.js";
export default i18n;
