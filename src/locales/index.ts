import { en } from "./en";
import { id } from "./id";

export type Locale = "en" | "id";
export type Translations = typeof en;

export const locales: Record<Locale, Translations> = {
    en,
    id
};

export const localeNames: Record<Locale, string> = {
    en: "English",
    id: "Bahasa Indonesia"
};

export function getTranslations(locale: Locale): Translations {
    return locales[locale] ?? en;
}

export { en, id };
