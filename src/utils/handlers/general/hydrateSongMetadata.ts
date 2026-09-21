import { type Rawon } from "../../../structures/Rawon.js";
import { type Song } from "../../../typings/index.js";
import { hydrateFromDump, logYtDlpFailure } from "./ytdlpMetadata.js";

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

function hasSpotifyDisplayUrl(song: Song): boolean {
    try {
        const parsed = new URL(song.url?.trim() ?? "");
        return parsed.hostname.endsWith("spotify.com");
    } catch {
        return false;
    }
}

export async function hydrateYouTubeSongMetadata(client: Rawon, song: Song): Promise<Song> {
    if (
        song.isLive === true ||
        (!shouldHydrateFromPlayableUrl(song) &&
            !hasYouTubeVideoThumbnail(song) &&
            !hasSpotifyDisplayUrl(song) &&
            positiveDuration(song.duration) !== null)
    ) {
        return song;
    }

    try {
        return (await hydrateFromDump(song)) ?? song;
    } catch (error) {
        logYtDlpFailure(client, "hydrateSongMetadata", error);
    }

    return song;
}
