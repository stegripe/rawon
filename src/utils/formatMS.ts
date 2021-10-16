import { lang } from "../config";
import { formatDuration, intervalToDuration } from "date-fns";
import * as locales from "date-fns/locale";

export function formatMS(ms: number): string {
    if (isNaN(ms)) throw new Error("value is not a number.");

    const key = Object.keys(locales).find(v => v.toLowerCase() === lang.toLowerCase());
    const locale = key ? (locales as Record<string, globalThis.Locale>)[key] : locales.enUS;

    return formatDuration(intervalToDuration({ start: 0, end: ms }), {
        locale
    });
}
