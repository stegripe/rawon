import { lang } from "../config";
import { formatDuration, intervalToDuration, Locale } from "date-fns";
import Locales from "date-fns/locale";

export function formatMS(ms: number): string {
    if (isNaN(ms)) throw new Error("value is not a number.");

    const locales = Locales as Record<string, Locale|undefined>;
    const locale = locales[lang] ?? locales.enUS;

    return formatDuration(intervalToDuration({ start: 0, end: ms }), {
        locale
    });
}
