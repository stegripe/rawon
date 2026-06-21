import { type Rawon } from "../../../structures/Rawon.js";
import { type SearchTrackResult } from "../../../typings/index.js";
import { checkQuery } from "./checkQuery.js";

export async function searchTrack(
    client: Rawon,
    query: string,
    source: "soundcloud" | "youtube" | undefined = "youtube",
): Promise<SearchTrackResult> {
    const queryData = checkQuery(query);
    if (queryData.isURL) {
        return client.license.resolveMusic(query);
    }

    return client.license.searchMusic(query, source ?? "youtube");
}
