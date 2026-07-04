import { type Rawon } from "../../../structures/Rawon.js";
import { type Song } from "../../../typings/index.js";
import { checkQuery } from "./checkQuery.js";

function positiveDuration(duration: unknown): number | null {
    return typeof duration === "number" && Number.isFinite(duration) && duration > 0
        ? duration
        : null;
}

function shouldHydrateFromPlayableUrl(song: Song): boolean {
    const playableUrl = song.playableUrl?.trim() ?? "";
    return playableUrl.length > 0 && playableUrl !== song.url;
}

export async function hydrateYouTubeSongMetadata(client: Rawon, song: Song): Promise<Song> {
    const hydrateFromPlayableUrl = shouldHydrateFromPlayableUrl(song);
    if (
        song.isLive === true ||
        (!hydrateFromPlayableUrl && positiveDuration(song.duration) !== null)
    ) {
        return song;
    }

    const lookupUrl = hydrateFromPlayableUrl ? (song.playableUrl as string) : song.url;
    const queryData = checkQuery(lookupUrl);
    if (!hydrateFromPlayableUrl && queryData.sourceType !== "youtube") {
        return song;
    }

    try {
        const resolved = await client.license.resolveMusic(lookupUrl);
        if (resolved && resolved.items.length > 0) {
            const info = resolved.items[0];
            const duration = positiveDuration(info.duration);

            return {
                ...song,
                duration: info.isLive ? 0 : (duration ?? song.duration),
                id: info.id || song.id,
                thumbnail: hydrateFromPlayableUrl
                    ? info.thumbnail || song.thumbnail
                    : song.thumbnail || info.thumbnail,
                title: song.title || info.title,
                url: song.url || info.url,
                isLive: info.isLive || song.isLive,
            };
        }
    } catch (error) {
        client.logger.debug("[hydrateSongMetadata] stegripe-api metadata lookup failed", {
            id: song.id,
            title: song.title,
            error: error instanceof Error ? error.message : String(error),
        });
    }

    return song;
}
