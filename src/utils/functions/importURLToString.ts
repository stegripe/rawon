import { platform } from "os";
import { URL } from "url";

export function importURLToString(url: string): string {
    const pathArray = new URL(url).pathname.split(/\/|\\/g).filter(Boolean);
    const path = pathArray.slice(0, -1).join("/");

    return decodeURIComponent(`${platform() === "win32" ? "" : "/"}${path}`);
}
