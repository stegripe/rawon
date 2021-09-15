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
    return {
        isURL: true,
        // Returns "soundcloud" | "youtube" | "spotify"
        sourceType: /soundcloud/g.exec(url.hostname) ? "soundcloud" : /spotify/g.exec(url.hostname) ? "spotify" : /youtube/g.exec(url.hostname) ? "youtube" : undefined
    };
}
