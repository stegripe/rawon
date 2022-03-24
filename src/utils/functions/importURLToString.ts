import { URL } from "url";
import { platform } from "os";

export function importURLToString(url: string): string {
    const pathArray = new URL(url).pathname.split(/\/|\\/g).filter(Boolean);
    const path = pathArray.slice(1).join("/");

    return decodeURIComponent(`${platform() === "win32" ? "" : "/"}${path}`);
}
