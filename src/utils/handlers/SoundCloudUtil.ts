import { createRequire } from "module";
import SC from "soundcloud.ts";

const require = createRequire(import.meta.url);
const Soundcloud = require("soundcloud.ts");

export const soundcloud = new (Soundcloud as { default: typeof SC }).default();
