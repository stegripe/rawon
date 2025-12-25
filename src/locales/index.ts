import { en } from "./en";
import { es } from "./es";
import { fr } from "./fr";
import { id } from "./id";
import { ja } from "./ja";
import { pt } from "./pt";
import { ru } from "./ru";
import { tr } from "./tr";
import { uk } from "./uk";
import { vi } from "./vi";
import { zhCN } from "./zh-CN";
import { zhTW } from "./zh-TW";

export type Locale =
    | "en"
    | "es"
    | "fr"
    | "id"
    | "ja"
    | "pt"
    | "ru"
    | "tr"
    | "uk"
    | "vi"
    | "zh-CN"
    | "zh-TW";
export type Translations = typeof en;

export const locales: Record<Locale, Translations> = {
    en,
    es,
    fr,
    id,
    ja,
    pt,
    ru,
    tr,
    uk,
    vi,
    "zh-CN": zhCN,
    "zh-TW": zhTW
};

export const localeNames: Record<Locale, string> = {
    en: "English",
    es: "Español",
    fr: "Français",
    id: "Bahasa Indonesia",
    ja: "日本語",
    pt: "Português",
    ru: "Русский",
    tr: "Türkçe",
    uk: "Українська",
    vi: "Tiếng Việt",
    "zh-CN": "简体中文",
    "zh-TW": "繁體中文"
};

export function getTranslations(locale: Locale): Translations {
    return locales[locale] ?? en;
}

export { en, es, fr, id, ja, pt, ru, tr, uk, vi, zhCN, zhTW };
