import { type Rawon } from "../../../structures/Rawon.js";
import { type Song } from "../../../typings/index.js";

function positiveDuration(duration: unknown): number | null {
    return typeof duration === "number" && Number.isFinite(duration) && duration > 0
        ? duration
        : null;
}

function shouldHydrateFromPlayableUrl(song: Song): boolean {
    const playableUrl = song.playableUrl?.trim() ?? "";
    return playableUrl.length > 0 && playableUrl !== song.url;
}

function hasYouTubeVideoThumbnail(song: Song): boolean {
    const thumbnail = song.thumbnail?.trim() ?? "";
    if (!thumbnail) {
        return false;
    }

    try {
        const parsed = new URL(thumbnail);
        return ["img.youtube.com", "i.ytimg.com"].includes(parsed.hostname);
    } catch {
        return false;
    }
}

export async function hydrateYouTubeSongMetadata(client: Rawon, song: Song): Promise<Song> {
    if (
        song.isLive === true ||
        (!shouldHydrateFromPlayableUrl(song) &&
            !hasYouTubeVideoThumbnail(song) &&
            positiveDuration(song.duration) !== null)
    ) {
        return song;
    }

    try {
        return (await client.license.hydrateMusicMetadata(song)) ?? song;
    } catch (error) {
        client.logger.debug("[hydrateSongMetadata] stegripe-api metadata lookup failed", {
            id: song.id,
            title: song.title,
            error: error instanceof Error ? error.message : String(error),
        });
    }

    return song;
}
