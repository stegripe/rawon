import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import {
    type ClientOptions,
    IntentsBitField,
    Options,
    type ShardingManagerMode,
    Sweepers,
} from "discord.js";
import i18n from "i18n";
import { enablePrefix, enableSlashCommand, lang, mainPrefix } from "./env.js";

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

const rootDir: string = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

export const clientOptions: ClientOptions & {
    loadMessageCommandListeners: boolean;
    defaultPrefix: string;
    baseUserDirectory: string;
} = {
    allowedMentions: { parse: ["users"], repliedUser: false },
    intents,
    makeCache: Options.cacheWithLimits({
        MessageManager: { maxSize: Infinity },
        ThreadManager: { maxSize: Infinity },
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
    loadMessageCommandListeners: false,
    defaultPrefix: mainPrefix,
    baseUserDirectory: rootDir,
};

i18n.configure({
    defaultLocale: "en-US",
    directory: path.join(process.cwd(), "lang"),
    locales: [
        "en-US",
        "es-ES",
        "id-ID",
        "fr-FR",
        "zh-CN",
        "zh-TW",
        "uk-UA",
        "vi-VN",
        "pt-BR",
        "ru-RU",
        "ja-JP",
        "tr-TR",
        "ko-KR",
        "ms-MY",
    ],
    objectNotation: true,
    updateFiles: false,
    syncFiles: false,
});

i18n.setLocale(lang);

export const shardsCount: number | "auto" = "auto";
export const shardingMode: ShardingManagerMode = "worker";

export { default } from "i18n";
export * from "./env.js";
