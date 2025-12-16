import path from "node:path";
import process from "node:process";
import {
    type ClientOptions,
    IntentsBitField,
    Options,
    type ShardingManagerMode,
    Sweepers,
} from "discord.js";
import i18n from "i18n";
import { enablePrefix, enableSlashCommand, lang } from "./env.js";

const intents: number[] = [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.GuildExpressions,
    IntentsBitField.Flags.GuildVoiceStates,
    IntentsBitField.Flags.GuildModeration,
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
        MessageManager: { maxSize: Number.POSITIVE_INFINITY },
        ThreadManager: { maxSize: Number.POSITIVE_INFINITY },
    }),
    sweepers: {
        messages: {
            interval: 300,
            filter: Sweepers.filterByLifetime({ lifetime: 10_800 }),
        },
        threads: {
            interval: 300,
            filter: Sweepers.filterByLifetime({
                lifetime: 10_800,
                getComparisonTimestamp: (el) => el.archiveTimestamp ?? 0,
                excludeFromSweep: (el) => el.archived !== true,
            }),
        },
    },
};

i18n.configure({
    defaultLocale: "en",
    directory: path.join(process.cwd(), "lang"),
    locales: ["en", "es", "id", "fr", "zh-CN", "zh-TW", "uk", "vi", "pt-BR", "ru", "ja", "tr"],
    objectNotation: true,
});

i18n.setLocale(lang);

export const shardsCount: number | "auto" = "auto";
export const shardingMode: ShardingManagerMode = "worker";

export { default } from "i18n";
export * from "./env.js";
