import { URL } from "url";
import { resolve, isAbsolute, normalize, relative } from "path";
import { platform } from "os";

export function importURLToString(url: string): string {
    const paths = new URL(url).pathname.split(/\/|\\/g).filter(Boolean);

    paths.pop();

    if (!isAbsolute(paths.join("/"))) {
        const hostPlatform = platform();
        if (hostPlatform === "linux")
            return decodeURIComponent(`/${paths.join("/")}`);
    }
    return decodeURIComponent(paths.join("/"));
}
