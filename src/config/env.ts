import { defaultPrefix } from "./constants.js";

export const enableSlashCommand = process.env.ENABLE_SLASH_COMMAND !== "no";
export const isDev = process.env.NODE_ENV === "development";
export const prefix = isDev ? "d+" : defaultPrefix;
