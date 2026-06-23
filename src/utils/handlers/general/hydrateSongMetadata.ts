import { type Rawon } from "../../../structures/Rawon.js";
import { type Song } from "../../../typings/index.js";
import { checkQuery } from "./checkQuery.js";

function positiveDuration(duration: unknown): number | null {
    return typeof duration === "number" && Number.isFinite(duration) && duration > 0
        ? duration
        : null;
}

export async function hydrateYouTubeSongMetadata(client: Rawon, song: Song): Promise<Song> {
    if (song.isLive === true || positiveDuration(song.duration) !== null) {
        return song;
    }

    const queryData = checkQuery(song.url);
    if (queryData.sourceType !== "youtube") {
        return song;
    }

    try {
        const resolved = await client.license.resolveMusic(song.url);
        if (resolved && resolved.items.length > 0) {
            const info = resolved.items[0];
            const duration = positiveDuration(info.duration);

            return {
                ...song,
                duration: info.isLive ? 0 : (duration ?? song.duration),
                id: info.id || song.id,
                thumbnail: song.thumbnail || info.thumbnail,
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
