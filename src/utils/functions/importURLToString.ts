import { URL } from "url";
import { platform } from "os";

export function importURLToString(url: string): string {
    const pathArray = new URL(url).pathname.split(/\/|\\/g).filter(Boolean);

    pathArray.pop();

    const path = pathArray.join("/");

    return decodeURIComponent(`${platform() === "win32" ? "" : "/"}${path}`);
}
