import { type PlaylistMetadata, type SearchTrackResult, type Song } from "../../typings/index.js";

const GOOGLE_THUMBNAIL_SIZE = 500;
const YOUTUBE_THUMBNAIL_QUALITY = "hqdefault";
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

function normalizeGoogleImageOptions(options: string): string | null {
    const parts = options.split("-").filter((part) => part.length > 0);
    const normalized: string[] = [];
    let changed = false;
    let hasWidth = false;
    let hasHeight = false;

    for (const part of parts) {
        if (/^w\d+$/iu.test(part)) {
            normalized.push(`w${GOOGLE_THUMBNAIL_SIZE}`);
            hasWidth = true;
            changed = true;
            continue;
        }

        if (/^h\d+$/iu.test(part)) {
            normalized.push(`h${GOOGLE_THUMBNAIL_SIZE}`);
            hasHeight = true;
            changed = true;
            continue;
        }

        if (/^s\d+$/iu.test(part)) {
            if (!hasWidth) {
                normalized.push(`w${GOOGLE_THUMBNAIL_SIZE}`);
                hasWidth = true;
            }
            if (!hasHeight) {
                normalized.push(`h${GOOGLE_THUMBNAIL_SIZE}`);
                hasHeight = true;
            }
            changed = true;
            continue;
        }

        normalized.push(/^l\d+$/iu.test(part) ? "l90" : part);
        changed = changed || /^l\d+$/iu.test(part);
    }

    if (!changed) {
        return null;
    }

    if (!hasWidth) {
        normalized.unshift(`w${GOOGLE_THUMBNAIL_SIZE}`);
    }
    if (!hasHeight) {
        normalized.splice(hasWidth ? 1 : 0, 0, `h${GOOGLE_THUMBNAIL_SIZE}`);
    }

    return normalized.join("-");
}

function getGoogleThumbnail(url: URL): string {
    if (
        !GOOGLE_IMAGE_HOST_PATTERN.test(url.hostname) &&
        !GOOGLE_PROFILE_IMAGE_HOST_PATTERN.test(url.hostname)
    ) {
        return url.toString();
    }

    const normalizedPath = url.pathname.replace(/=([^/]*)$/u, (match, options: string) => {
        const normalizedOptions = normalizeGoogleImageOptions(options);
        return normalizedOptions === null ? match : `=${normalizedOptions}`;
    });

    url.pathname = normalizedPath;
    return url.toString();
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

    const targetArea = GOOGLE_THUMBNAIL_SIZE * GOOGLE_THUMBNAIL_SIZE;
    const preferred = candidates
        .map((thumbnail) => {
            const width = thumbnail.width ?? 0;
            const height = thumbnail.height ?? 0;
            const area = width > 0 && height > 0 ? width * height : targetArea;
            return {
                thumbnail,
                score: Math.abs(area - targetArea),
            };
        })
        .sort((a, b) => a.score - b.score)
        .at(0)?.thumbnail.url;

    return getMediumResThumbnail(preferred ?? fallback);
}

export function normalizeSongThumbnail<T extends Song>(song: T): T {
    const thumbnail = getMediumResThumbnail(song.thumbnail);
    if (thumbnail === song.thumbnail) {
        return song;
    }

    return { ...song, thumbnail };
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
