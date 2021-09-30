import { lang } from "../config";
import { formatDuration, intervalToDuration, Locale } from "date-fns";
import { existsSync } from "fs";
import { resolve } from "path";

export function formatMS(ms: number): string {
    if (isNaN(ms)) throw new Error("value is not a number.");

    const folderName = existsSync(resolve(process.cwd(), "node_modules", "date-fns", "locale", lang)) ? lang : "en-US";
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const locale = require(`date-fns/locale/${folderName}`) as Locale;

    return formatDuration(intervalToDuration({ start: 0, end: ms }), {
        locale
    });
}
