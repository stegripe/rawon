import { soundcloud } from "./SoundCloudUtil";
import { QueryData } from "../../typings";
import { URL } from "url";

export async function searchTrack(query: string): Promise<any> {
    const url = new URL(query);
    const queryData = checkQuery(query);
    if (queryData.isURL) {
        if (queryData.sourceType === "soundcloud") {
            const tracks = soundcloud.tracks.getV2(url.pathname.substring(1));
            console.log(tracks);
        }
    }
}

export function checkQuery(string: string): QueryData {
    let url: URL;
    try {
        url = new URL(string);
    } catch (e) {
        return {
            isURL: false,
            sourceType: "query"
        };
    }

    const result: QueryData = {
        isURL: true
    };

    if (/soundcloud|snd/g.exec(url.hostname)) {
        result.sourceType = "soundcloud";

        if (url.pathname.includes("/sets/")) {
            result.type = "playlist";
        } else {
            result.type = "track";
        }
    } else if (/youtube|youtu\.be/g.exec(url.hostname)) {
        result.sourceType = "youtube";

        if (!/youtu\.be/g.exec(url.hostname) && url.pathname.startsWith("/playlist")) {
            result.type = "playlist";
        } else if ((/youtube/g.exec(url.hostname) && url.pathname.startsWith("/watch")) || (/youtu\.be/g.exec(url.hostname) && (url.pathname !== ""))) {
            result.type = "track";
        } else {
            result.type = "unknown";
        }
    } else if (/spotify/g.exec(url.hostname)) {
        result.sourceType = "spotify";

        if (url.pathname.startsWith("/playlist")) {
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
