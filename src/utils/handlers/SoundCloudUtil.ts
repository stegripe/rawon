import { createRequire } from "node:module";
import SC from "soundcloud.ts";

// Temporary solution
const require = createRequire(import.meta.url);
const Soundcloud = require("soundcloud.ts");

export const soundcloud = new (Soundcloud as { default: typeof SC }).default();
