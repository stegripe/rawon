/* eslint-disable @typescript-eslint/naming-convention */
import { RawonLang } from "../../typings/langs.js";
import { resolve } from "node:path";
import i18n from "i18n";

i18n.configure({
    defaultLocale: "en",
    directory: resolve(process.cwd(), "locales"),
    locales: ["en"],
    objectNotation: true
});

type WithArgs = Exclude<Values<{ [K in keyof RawonLang]: RawonLang[K] extends string ? null : K }>, null>;

export default {
    __: (key: keyof RawonLang): string => i18n.__(key),
    __mf: <K extends WithArgs> (key: K, args: RawonLang[K]): string => i18n.__mf(key, args)
};
