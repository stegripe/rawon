/* eslint-disable typescript/strict-boolean-expressions */
import { URL } from "node:url";
import { type QueryData } from "../../../typings/index.js";

export function checkQuery(string: string): QueryData {
    let url: URL;
    try {
        url = new URL(string);
    } catch {
        return {
            isURL: false,
            sourceType: "query",
        };
    }

    const result: QueryData = {
        isURL: true,
    };

    if (/soundcloud|snd/gu.test(url.hostname)) {
        result.sourceType = "soundcloud";

        result.type = url.pathname.includes("/sets/") ? "playlist" : "track";
    } else if (/youtube|youtu\.be/gu.test(url.hostname)) {
        result.sourceType = "youtube";

        if (
            (!/youtu\.be/gu.test(url.hostname) && url.pathname.startsWith("/playlist")) ||
            url.searchParams.has("list")
        ) {
            result.type = "playlist";
        } else if (
            (/youtube/gu.exec(url.hostname) && url.pathname.startsWith("/watch")) ??
            (/youtube/gu.exec(url.hostname) && url.pathname.startsWith("/shorts/")) ??
            (/youtu\.be/gu.exec(url.hostname) && url.pathname !== "")
        ) {
            result.type = "track";
        } else {
            result.type = "unknown";
        }
    } else if (/spotify/gu.test(url.hostname)) {
        result.sourceType = "spotify";

        if (["/playlist", "/album"].some((path) => url.pathname.startsWith(path))) {
            result.type = "playlist";
        } else if (url.pathname.startsWith("/track")) {
            result.type = "track";
        } else {
            result.type = "unknown";
        }
    } else {
        result.sourceType = "unknown";
        result.type = "unknown";
    }

    return result;
}
