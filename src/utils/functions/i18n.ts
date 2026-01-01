import { type Guild } from "discord.js";
import i18n from "i18n";
import { type Rawon } from "../../structures/Rawon.js";

export const supportedLocales = [
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
] as const;

export type SupportedLocale = (typeof supportedLocales)[number];

export function isSupportedLocale(locale: string): locale is SupportedLocale {
    return supportedLocales.includes(locale as SupportedLocale);
}

/**
 * Gets the locale for a guild from the stored data.
 * Falls back to the default locale from config if not set.
 */
export function getGuildLocale(client: Rawon, guildId: string | null | undefined): string {
    if (!guildId) {
        return client.config.lang;
    }
    const guildData = client.data.data?.[guildId];
    return guildData?.locale ?? client.config.lang;
}

/**
 * Creates a localized i18n function for a specific guild.
 * This allows per-guild language settings.
 */
export function i18n__(
    client: Rawon,
    guild: Guild | string | null | undefined,
): (phrase: string, ...replace: string[]) => string {
    const guildId = typeof guild === "string" ? guild : guild?.id;
    const locale = getGuildLocale(client, guildId);
    return (phrase: string, ...replace: string[]): string => {
        return i18n.__({ phrase, locale }, ...replace);
    };
}

/**
 * Creates a localized i18n.__mf function for a specific guild.
 * This allows per-guild language settings with message formatting.
 */
export function i18n__mf(
    client: Rawon,
    guild: Guild | string | null | undefined,
): (phrase: string, replacements?: Record<string, unknown>) => string {
    const guildId = typeof guild === "string" ? guild : guild?.id;
    const locale = getGuildLocale(client, guildId);
    return (phrase: string, replacements?: Record<string, unknown>): string => {
        return i18n.__mf({ phrase, locale }, replacements ?? {});
    };
}
