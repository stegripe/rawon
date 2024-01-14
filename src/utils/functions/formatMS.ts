import { lang } from "../../config/index.js";
import { format, formatDuration, intervalToDuration, Locale } from "date-fns";
import { createRequire } from "node:module";

const req = createRequire(import.meta.url);
const locales: Record<string, Locale> = req("date-fns/locale");

const key = Object.keys(locales).find(v => v.toLowerCase() === lang.toLowerCase());
const locale = key ? locales[key] : locales.enUS;

export function formatMS(ms: number): string {
    if (isNaN(ms)) throw new Error("Value is not a number.");

    return formatDuration(intervalToDuration({ start: 0, end: ms }), {
        locale
    });
}

export function formatTime(time: number): string {
    if (isNaN(time)) throw new Error("Value is not a number.");

    return format(time, "P HH:mm", {
        locale
    });
}
