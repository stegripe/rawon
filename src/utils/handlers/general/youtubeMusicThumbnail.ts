import got from "got";
import { type Song } from "../../../typings/index.js";
import {
    getMediumResThumbnail,
    isGoogleImageHost,
    isNativeAlbumThumbnail,
    isYouTubeMusicUrl,
} from "../../functions/getMaxResThumbnail.js";
import { extractYouTubeVideoIdFromSong } from "./ytdlpMetadata.js";

const PLAYER_ENDPOINT = "https://music.youtube.com/youtubei/v1/player?prettyPrint=false";
const SEARCH_ENDPOINT = "https://music.youtube.com/youtubei/v1/search?prettyPrint=false";
const CLIENT_VERSION = "1.20260609.01.00";
const USER_AGENT =
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36";
const SONGS_FILTER = "EgWKAQIIAWoKEAMQBBAJEAoQBQ%3D%3D";
const THUMBNAIL_CONCURRENCY = 4;

type JsonObject = Record<string, unknown>;

const thumbnailCache = new Map<string, Promise<string | undefined>>();

function isObject(value: unknown): value is JsonObject {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function walkJson(value: unknown, visit: (node: JsonObject) => void): void {
    if (Array.isArray(value)) {
        for (const item of value) {
            walkJson(item, visit);
        }
        return;
    }
    if (!isObject(value)) {
        return;
    }
    visit(value);
    for (const child of Object.values(value)) {
        walkJson(child, visit);
    }
}

function youtubeMusicContext(): JsonObject {
    return {
        client: {
            hl: "en",
            gl: "ID",
            clientName: "WEB_REMIX",
            clientVersion: CLIENT_VERSION,
            osName: "Windows",
            osVersion: "10.0",
            platform: "DESKTOP",
            browserName: "Chrome",
            browserVersion: "149.0.0.0",
            userAgent: `${USER_AGENT},gzip(gfe)`,
        },
        user: { lockedSafetyMode: false },
        request: { useSsl: true },
    };
}

function isAvatarThumbnail(url: string): boolean {
    const lower = url.toLowerCase();
    return lower.includes("/ytc/") || lower.includes("/a/") || lower.includes("-c-k-c0");
}

function isYouTubeMusicAlbumArt(url: string): boolean {
    try {
        const parsed = new URL(url);
        return isGoogleImageHost(parsed.hostname) && !isAvatarThumbnail(url);
    } catch {
        return false;
    }
}

function bestAlbumArt(payload: unknown): string | undefined {
    let bestUrl = "";
    let bestScore = -1;
    walkJson(payload, (node) => {
        if (typeof node.url !== "string" || !isYouTubeMusicAlbumArt(node.url)) {
            return;
        }
        const width = typeof node.width === "number" ? node.width : 0;
        const height = typeof node.height === "number" ? node.height : 0;
        const score =
            width > 0 && height > 0
                ? width * height - Math.abs(width - height) * 1_000
                : node.url.length;
        if (score <= bestScore) {
            return;
        }
        bestScore = score;
        bestUrl = node.url;
    });
    return bestUrl.length > 0 ? getMediumResThumbnail(bestUrl) : undefined;
}

async function postYouTubeMusic(endpoint: string, body: JsonObject): Promise<unknown> {
    return got
        .post(endpoint, {
            json: body,
            headers: {
                "Content-Type": "application/json",
                Origin: "https://music.youtube.com",
                Referer: "https://music.youtube.com/",
                "User-Agent": USER_AGENT,
                "X-Youtube-Client-Name": "67",
                "X-Youtube-Client-Version": CLIENT_VERSION,
            },
            timeout: { request: 12_000 },
        })
        .json();
}

async function albumArtFromPlayer(videoId: string): Promise<string | undefined> {
    const payload = await postYouTubeMusic(PLAYER_ENDPOINT, {
        context: youtubeMusicContext(),
        videoId,
    });
    if (!isObject(payload)) {
        return undefined;
    }
    return bestAlbumArt(payload);
}

async function albumArtFromSearch(query: string): Promise<string | undefined> {
    const payload = await postYouTubeMusic(SEARCH_ENDPOINT, {
        context: youtubeMusicContext(),
        query,
        params: SONGS_FILTER,
    });

    let found: string | undefined;
    walkJson(payload, (node) => {
        if (found !== undefined) {
            return;
        }
        const renderer = node.musicResponsiveListItemRenderer;
        if (!isObject(renderer)) {
            return;
        }
        found = bestAlbumArt(renderer);
    });
    return found;
}

function searchQueryForSong(song: Song): string {
    return [song.title, song.author].filter(Boolean).join(" ").trim();
}

function cachedThumbnail(
    key: string,
    loader: () => Promise<string | undefined>,
): Promise<string | undefined> {
    const existing = thumbnailCache.get(key);
    if (existing !== undefined) {
        return existing;
    }
    const pending = loader().catch(() => undefined);
    thumbnailCache.set(key, pending);
    return pending;
}

function isYouTubeMusicTarget(song: Song): boolean {
    return isYouTubeMusicUrl(song.url?.trim() ?? "");
}

export async function fetchYouTubeMusicThumbnail(song: Song): Promise<string | undefined> {
    if (!isYouTubeMusicTarget(song)) {
        return undefined;
    }

    const existingThumbnail = song.thumbnail?.trim() ?? "";
    if (isNativeAlbumThumbnail(existingThumbnail) && !isAvatarThumbnail(existingThumbnail)) {
        return getMediumResThumbnail(existingThumbnail);
    }

    const videoId = extractYouTubeVideoIdFromSong(song);
    if (videoId !== null) {
        const fromPlayer = await cachedThumbnail(`player:${videoId}`, () =>
            albumArtFromPlayer(videoId),
        );
        if (fromPlayer !== undefined) {
            return fromPlayer;
        }
        const fromVideoSearch = await cachedThumbnail(`search-id:${videoId}`, () =>
            albumArtFromSearch(videoId),
        );
        if (fromVideoSearch !== undefined) {
            return fromVideoSearch;
        }
    }

    const query = searchQueryForSong(song);
    if (query.length === 0) {
        return undefined;
    }
    return cachedThumbnail(`search:${query.toLowerCase()}`, () => albumArtFromSearch(query));
}

async function mapWithConcurrency<T, R>(
    items: T[],
    concurrency: number,
    mapper: (item: T) => Promise<R>,
): Promise<R[]> {
    if (items.length === 0) {
        return [];
    }

    const results: R[] = Array.from({ length: items.length });
    let nextIndex = 0;
    const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
        while (nextIndex < items.length) {
            const index = nextIndex;
            nextIndex += 1;
            results[index] = await mapper(items[index]);
        }
    });
    await Promise.all(workers);
    return results;
}

export async function applyYouTubeMusicThumbnails(songs: Song[]): Promise<Song[]> {
    return mapWithConcurrency(songs, THUMBNAIL_CONCURRENCY, async (song) => {
        if (song.isLive === true) {
            return song;
        }
        const thumbnail = await fetchYouTubeMusicThumbnail(song);
        if (thumbnail === undefined || thumbnail === song.thumbnail) {
            return song;
        }
        return { ...song, thumbnail };
    });
}
