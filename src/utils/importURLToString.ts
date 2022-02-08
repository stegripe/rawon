import { URL } from "url";

export function importURLToString(url: string): string {
    const paths = new URL(url).pathname.split(/\/|\\/g).filter(Boolean);

    paths.pop();
    return decodeURIComponent(paths.join("/"));
}
