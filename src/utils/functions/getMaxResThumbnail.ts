import { type PlaylistMetadata, type SearchTrackResult, type Song } from "../../typings/index.js";

const GOOGLE_THUMBNAIL_SIZE = 500;
const YOUTUBE_THUMBNAIL_QUALITY = "maxresdefault";
const GOOGLE_IMAGE_HOST_PATTERN = /(?:^|\.)googleusercontent\.com$/iu;
const GOOGLE_PROFILE_IMAGE_HOST_PATTERN = /(?:^|\.)ggpht\.com$/iu;
const SOUNDCLOUD_IMAGE_HOST_PATTERN = /(?:^|\.)sndcdn\.com$/iu;
const YOUTUBE_IMAGE_HOSTS = new Set(["img.youtube.com", "i.ytimg.com"]);

type ThumbnailCandidate = {
    url?: string | null;
    width?: number | null;
    height?: number | null;
};

export function getYouTubeThumbnail(videoId: string): string {
    return `https://img.youtube.com/vi/${videoId}/${YOUTUBE_THUMBNAIL_QUALITY}.jpg`;
}

function canonicalYouTubeWatchUrl(videoId: string): string {
    return `https://youtube.com/watch?v=${videoId}`;
}

function isYouTubeVideoId(id: string): boolean {
    return /^[\w-]{11}$/u.test(id);
}

function isYouTubeSong(song: Song): boolean {
    const url = song.url?.trim() ?? "";
    if (/youtube|youtu\.be/giu.test(url)) {
        return true;
    }

    return isYouTubeVideoId(song.id?.trim() ?? "");
}

function isGoogleImageHost(hostname: string): boolean {
    return (
        GOOGLE_IMAGE_HOST_PATTERN.test(hostname) || GOOGLE_PROFILE_IMAGE_HOST_PATTERN.test(hostname)
    );
}

function resolveYouTubeSongThumbnail(videoId: string, existingThumbnail: string): string {
    const existing = existingThumbnail.trim();
    if (existing.length > 0) {
        try {
            const parsed = new URL(existing);
            if (isGoogleImageHost(parsed.hostname)) {
                return getSquareGoogleThumbnail(parsed);
            }
        } catch {}
    }

    return getYouTubeThumbnail(videoId);
}

function getSquareGoogleThumbnail(url: URL): string {
    const basePath = url.pathname.replace(/=([^/]*)$/u, "");
    url.pathname = `${basePath}=s${GOOGLE_THUMBNAIL_SIZE}`;
    return url.toString();
}

export function normalizeLicensedSong<T extends Song>(song: T): T {
    const id = song.id?.trim() ?? "";
    const isYouTube = isYouTubeSong(song);
    const resolvedUrl =
        song.url?.trim() ||
        (isYouTube && id.length > 0 ? canonicalYouTubeWatchUrl(id) : (song.url ?? ""));
    let resolvedThumbnail = getMediumResThumbnail(song.thumbnail);
    if (isYouTube && id.length > 0) {
        resolvedThumbnail = resolveYouTubeSongThumbnail(id, song.thumbnail ?? "");
    }

    if (resolvedUrl === song.url && resolvedThumbnail === song.thumbnail) {
        return song;
    }

    return {
        ...song,
        url: resolvedUrl,
        thumbnail: resolvedThumbnail,
    };
}

export function getSoundCloudThumbnail(url: string | undefined | null): string {
    if (!url || url.length === 0) {
        return "";
    }

    let parsedUrl: URL;
    try {
        parsedUrl = new URL(url);
    } catch {
        return url;
    }

    if (!SOUNDCLOUD_IMAGE_HOST_PATTERN.test(parsedUrl.hostname)) {
        return url;
    }

    parsedUrl.pathname = parsedUrl.pathname.replace(
        /-(?:t\d+x\d+|crop|large|small|tiny|mini|badge|original)\.(jpg|jpeg|png|webp)$/iu,
        "-t500x500.$1",
    );

    return parsedUrl.toString();
}

function getGoogleThumbnail(url: URL): string {
    if (!isGoogleImageHost(url.hostname)) {
        return url.toString();
    }

    return getSquareGoogleThumbnail(url);
}

export function getMediumResThumbnail(url: string | undefined | null): string {
    if (!url || url.length === 0) {
        return "";
    }

    let parsedUrl: URL;
    try {
        parsedUrl = new URL(url);
    } catch {
        return url;
    }

    if (YOUTUBE_IMAGE_HOSTS.has(parsedUrl.hostname)) {
        const videoIdMatch = parsedUrl.pathname.match(/\/vi(?:_webp)?\/([^/]+)/u);
        if (!videoIdMatch?.[1]) {
            return url;
        }

        return getYouTubeThumbnail(videoIdMatch[1]);
    }

    const soundCloudThumbnail = getSoundCloudThumbnail(url);
    if (soundCloudThumbnail !== url) {
        return soundCloudThumbnail;
    }

    return getGoogleThumbnail(parsedUrl);
}

function thumbnailPreferenceScore(url: string, width: number, height: number): number {
    let score = 0;
    try {
        if (isGoogleImageHost(new URL(url).hostname)) {
            score += 1_000_000;
        }
    } catch {}
    if (width > 0 && height > 0) {
        score += width * height;
        score -= Math.abs(width - height) * 1_000;
        return score;
    }
    return score + url.length;
}

export function getMediumResThumbnailFromCandidates(
    thumbnails: ThumbnailCandidate[] | undefined | null,
    fallback = "",
): string {
    const candidates = (thumbnails ?? []).filter(
        (thumbnail): thumbnail is ThumbnailCandidate & { url: string } =>
            typeof thumbnail.url === "string" && thumbnail.url.length > 0,
    );

    if (candidates.length === 0) {
        return getMediumResThumbnail(fallback);
    }

    const preferred = candidates
        .map((thumbnail) => {
            const width = thumbnail.width ?? 0;
            const height = thumbnail.height ?? 0;
            return {
                thumbnail,
                score: thumbnailPreferenceScore(thumbnail.url, width, height),
            };
        })
        .sort((a, b) => b.score - a.score)
        .at(0)?.thumbnail.url;

    return getMediumResThumbnail(preferred ?? fallback);
}

export function normalizeSongThumbnail<T extends Song>(song: T): T {
    return normalizeLicensedSong(song);
}

export function normalizePlaylistThumbnail<T extends PlaylistMetadata>(playlist: T): T {
    if (playlist.thumbnail === undefined) {
        return playlist;
    }

    const thumbnail = getMediumResThumbnail(playlist.thumbnail);
    if (thumbnail === playlist.thumbnail) {
        return playlist;
    }

    return { ...playlist, thumbnail };
}

export function normalizeSearchTrackThumbnails(result: SearchTrackResult): SearchTrackResult {
    return {
        ...result,
        items: result.items.map(normalizeSongThumbnail),
        playlist:
            result.playlist === undefined ? undefined : normalizePlaylistThumbnail(result.playlist),
    };
}

export function getMaxResThumbnail(url: string | undefined | null): string {
    return getMediumResThumbnail(url);
}
