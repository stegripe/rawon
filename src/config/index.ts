import path from "node:path";
import process from "node:process";
import type { ClientOptions, ShardingManagerMode } from "discord.js";
import { IntentsBitField, Options, Sweepers } from "discord.js";
import i18n from "i18n";
import { lang, enablePrefix, enableSlashCommand } from "./env.js";

const intents: number[] = [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.GuildEmojisAndStickers,
    IntentsBitField.Flags.GuildVoiceStates,
    IntentsBitField.Flags.GuildModeration
];

if (enablePrefix) {
    intents.push(IntentsBitField.Flags.MessageContent);
}

if (!enablePrefix && !enableSlashCommand) {
    console.log("Both Slash Command and Prefix are disabled. Stopping the bot...");
    process.exit(1);
}

export const clientOptions: ClientOptions = {
    allowedMentions: { parse: ["users"], repliedUser: true },
    intents,
    makeCache: Options.cacheWithLimits({
        MessageManager: { maxSize: Infinity },
        ThreadManager: { maxSize: Infinity }
    }),
    sweepers: {
        messages: {
            interval: 300,
            filter: Sweepers.filterByLifetime({ lifetime: 10_800 })
        },
        threads: {
            interval: 300,
            filter: Sweepers.filterByLifetime({
                lifetime: 10_800,
                getComparisonTimestamp: (el) => el.archiveTimestamp ?? 0,
                excludeFromSweep: (el) => el.archived !== true
            })
        }
    }
};

i18n.configure({
    defaultLocale: "en",
    directory: path.join(process.cwd(), "lang"),
    locales: ["en", "es", "id", "fr", "zh-CN", "zh-TW", "uk", "vi", "pt-BR", "ru", "ja", "tr"],
    objectNotation: true
});

i18n.setLocale(lang);

export const shardsCount: number | "auto" = "auto";
export const shardingMode: ShardingManagerMode = "worker";
export * from "./env.js";

export { default } from "i18n";
