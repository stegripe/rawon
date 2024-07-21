/* eslint-disable unicorn/filename-case */
import { createRequire } from "node:module";
import type { Locale } from "date-fns";
import { format, formatDuration, intervalToDuration } from "date-fns";
import { lang } from "../../config/index.js";

const req = createRequire(import.meta.url);
const locales = req("date-fns/locale") as Record<string, Locale>;

const key = Object.keys(locales).find(val => val.toLowerCase() === lang.toLowerCase());
const locale = key === undefined ? locales.enUS : locales[key];

export function formatMS(ms: number): string {
    if (Number.isNaN(ms)) throw new Error("Value is not a number.");

    return formatDuration(intervalToDuration({ start: 0, end: ms }), {
        locale
    });
}

export function formatTime(time: number): string {
    if (Number.isNaN(time)) throw new Error("Value is not a number.");

    return format(time, "P HH:mm", {
        locale
    });
}
