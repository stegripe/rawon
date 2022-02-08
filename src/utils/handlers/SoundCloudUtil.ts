import SC from "soundcloud.ts";
import { createRequire } from "module";

// temporary solution
const require = createRequire(import.meta.url);
const Soundcloud = require("soundcloud.ts");

export const soundcloud = new (Soundcloud as { default: typeof SC }).default();
