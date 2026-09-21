import { type Rawon } from "../../../structures/Rawon.js";
import { type SearchTrackResult } from "../../../typings/index.js";
import {
    normalizeSearchTrackThumbnails,
    withYouTubeVideoThumbnail,
} from "../../functions/getMaxResThumbnail.js";
import { resolveSearchProvider } from "../../functions/searchProvider.js";
import { checkQuery } from "./checkQuery.js";
import { resolveSpotifyUrl } from "./spotifyResolve.js";
import { applyYouTubeMusicThumbnails } from "./youtubeMusicThumbnail.js";
import { resolveExtractorUrl, resolveUnknownUrl, searchExtractorTracks } from "./ytdlpMetadata.js";

function withNormalizedThumbnails(result: SearchTrackResult): SearchTrackResult {
    return normalizeSearchTrackThumbnails(result);
}

async function withAccurateThumbnails(result: SearchTrackResult): Promise<SearchTrackResult> {
    const items = await applyYouTubeMusicThumbnails(result.items);
    return withNormalizedThumbnails({
        ...result,
        items: items.map(withYouTubeVideoThumbnail),
    });
}

export async function searchTrack(
    client: Rawon,
    query: string,
    source: "soundcloud" | "youtube" | undefined = "youtube",
): Promise<SearchTrackResult> {
    const provider = resolveSearchProvider(client);
    const queryData = checkQuery(query);
    if (!queryData.isURL) {
        return withAccurateThumbnails(
            await searchExtractorTracks(query, source ?? "youtube", 10, provider),
        );
    }

    const sourceType = queryData.sourceType ?? "unknown";
    switch (sourceType) {
        case "query":
            return withAccurateThumbnails(
                await searchExtractorTracks(query, source ?? "youtube", 10, provider),
            );
        case "youtube":
            return withAccurateThumbnails(await resolveExtractorUrl(query, queryData.type));
        case "soundcloud":
            return withNormalizedThumbnails(await resolveExtractorUrl(query, queryData.type));
        case "spotify":
            return withNormalizedThumbnails(await resolveSpotifyUrl(client, query));
        case "unknown":
            return withNormalizedThumbnails(await resolveUnknownUrl(query));
        default: {
            const exhaustive: never = sourceType;
            throw new Error(`Unsupported query source: ${String(exhaustive)}`);
        }
    }
}
