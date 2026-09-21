import { type Rawon } from "../../../structures/Rawon.js";
import { type SearchTrackResult } from "../../../typings/index.js";
import { normalizeSearchTrackThumbnails } from "../../functions/getMaxResThumbnail.js";
import { checkQuery } from "./checkQuery.js";
import { resolveSpotifyUrl } from "./spotifyResolve.js";
import { resolveExtractorUrl, resolveUnknownUrl, searchExtractorTracks } from "./ytdlpMetadata.js";

export async function searchTrack(
    client: Rawon,
    query: string,
    source: "soundcloud" | "youtube" | undefined = "youtube",
): Promise<SearchTrackResult> {
    const queryData = checkQuery(query);
    if (!queryData.isURL) {
        return normalizeSearchTrackThumbnails(
            await searchExtractorTracks(query, source ?? "youtube"),
        );
    }

    const sourceType = queryData.sourceType ?? "unknown";
    switch (sourceType) {
        case "query":
            return normalizeSearchTrackThumbnails(
                await searchExtractorTracks(query, source ?? "youtube"),
            );
        case "youtube":
        case "soundcloud":
            return normalizeSearchTrackThumbnails(await resolveExtractorUrl(query, queryData.type));
        case "spotify":
            return normalizeSearchTrackThumbnails(await resolveSpotifyUrl(client, query));
        case "unknown":
            return normalizeSearchTrackThumbnails(await resolveUnknownUrl(query));
        default: {
            const exhaustive: never = sourceType;
            throw new Error(`Unsupported query source: ${String(exhaustive)}`);
        }
    }
}
