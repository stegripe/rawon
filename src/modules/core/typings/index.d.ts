import * as Mod from "../index.js";

declare global {
    interface RawonModules {
        core: typeof Mod;
    }
}
