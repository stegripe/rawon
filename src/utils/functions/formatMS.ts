/* eslint-disable unicorn/filename-case */
import { createRequire } from "node:module";
import type { Locale } from "date-fns";
import { format } from "date-fns";
import { lang } from "../../config/index.js";

const req = createRequire(import.meta.url);
const locales = req("date-fns/locale") as Record<string, Locale>;

const key = Object.keys(locales).find(val => val.toLowerCase() === lang.toLowerCase());
const locale = key === undefined ? locales.enUS : locales[key];

export function formatMS(ms: number): string {
    if (Number.isNaN(ms) || ms < 0) throw new Error("Value must be a positive number.");

    const seconds = Math.floor(ms / 1_000) % 60;
    const minutes = Math.floor(ms / (1_000 * 60)) % 60;
    const hours = Math.floor(ms / (1_000 * 60 * 60)) % 24;
    const days = Math.floor(ms / (1_000 * 60 * 60 * 24)) % 30;
    const months = Math.floor(ms / (1_000 * 60 * 60 * 24 * 30));    

    const parts = [];
    if (months > 0) parts.push(`${months} months`);
    if (days > 0) parts.push(`${days} days`);
    if (hours > 0) parts.push(`${hours} hours`);
    if (minutes > 0) parts.push(`${minutes} minutes`);
    if (seconds > 0) parts.push(`${seconds} seconds`);

    return parts.join(" ");
}

export function formatTime(time: number): string {
    if (Number.isNaN(time)) throw new Error("Value is not a number.");

    return format(time, "P HH:mm", {
        locale
    });
}
