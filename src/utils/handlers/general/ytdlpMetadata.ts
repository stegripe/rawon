import { type Rawon } from "../../../structures/Rawon.js";
import {
    type PlaylistMetadata,
    type SearchProvider,
    type SearchTrackResult,
    type Song,
} from "../../../typings/index.js";
import {
    getMediumResThumbnail,
    getMediumResThumbnailFromCandidates,
    isYouTubeMusicUrl,
    shouldKeepExistingThumbnail,
} from "../../functions/getMaxResThumbnail.js";
import ytdl from "../../yt-dlp/index.js";
import { searchYouTubeMusic } from "./youtubeMusicSearch.js";

const YOUTUBE_VIDEO_ID_PATTERN = /^[\w-]{11}$/u;

export type YtDlpDumpEntry = {
    id?: string;
    title?: string;
    fulltitle?: string;
    url?: string;
    webpage_url?: string;
    original_url?: string;
    duration?: number | null;
    thumbnail?: string;
    thumbnails?: { url?: string; width?: number; height?: number }[];
    uploader?: string;
    channel?: string;
    artist?: string;
    creator?: string;
    is_live?: boolean;
    live_status?: string;
    _type?: string;
    entries?: Array<YtDlpDumpEntry | null> | null;
    extractor?: string;
    extractor_key?: string;
    playlist_title?: string;
    playlist?: string;
    n_entries?: number;
};

const DUMP_OPTIONS = {
    dumpSingleJson: true,
    skipDownload: true,
    quiet: true,
    noWarnings: true,
    ignoreErrors: true,
} as const;

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
}

function asDumpEntry(value: unknown): YtDlpDumpEntry | null {
    if (!isRecord(value)) {
        return null;
    }

    return value as YtDlpDumpEntry;
}

function positiveDuration(duration: unknown): number {
    return typeof duration === "number" && Number.isFinite(duration) && duration > 0 ? duration : 0;
}

function isLiveEntry(entry: YtDlpDumpEntry): boolean {
    return entry.is_live === true || entry.live_status === "is_live";
}

export function extractYouTubeVideoId(value: string | null | undefined): string | null {
    const raw = value?.trim() ?? "";
    if (raw.length === 0) {
        return null;
    }

    if (YOUTUBE_VIDEO_ID_PATTERN.test(raw)) {
        return raw;
    }

    try {
        const parsed = new URL(raw);
        const host = parsed.hostname.replace(/^www\./u, "");
        if (host === "youtu.be") {
            const id = parsed.pathname.split("/").filter(Boolean)[0] ?? "";
            return YOUTUBE_VIDEO_ID_PATTERN.test(id) ? id : null;
        }

        if (host === "youtube.com" || host === "music.youtube.com" || host === "m.youtube.com") {
            const videoId = parsed.searchParams.get("v")?.trim() ?? "";
            if (YOUTUBE_VIDEO_ID_PATTERN.test(videoId)) {
                return videoId;
            }

            const pathId = parsed.pathname.split("/").filter(Boolean).at(-1) ?? "";
            return YOUTUBE_VIDEO_ID_PATTERN.test(pathId) ? pathId : null;
        }
    } catch {
        return null;
    }

    return null;
}

export function extractYouTubeVideoIdFromSong(song: Song): string | null {
    return (
        extractYouTubeVideoId(song.id) ??
        extractYouTubeVideoId(song.playableUrl) ??
        extractYouTubeVideoId(song.url)
    );
}

export function mapDumpEntryToSong(
    entry: YtDlpDumpEntry,
    overrides: Partial<Song> = {},
): Song | null {
    const id = entry.id?.trim() ?? "";
    const url = (entry.webpage_url ?? entry.original_url ?? entry.url ?? "").trim();
    const title = (entry.title ?? entry.fulltitle ?? "").trim();
    if ((id.length === 0 && url.length === 0) || title.length === 0) {
        return null;
    }

    const youtubeId = extractYouTubeVideoId(id) ?? extractYouTubeVideoId(url);
    const resolvedUrl =
        url.length > 0
            ? url
            : youtubeId === null
              ? ""
              : `https://www.youtube.com/watch?v=${youtubeId}`;
    if (resolvedUrl.length === 0) {
        return null;
    }

    return {
        id: youtubeId ?? id,
        title,
        url: resolvedUrl,
        duration: positiveDuration(entry.duration),
        thumbnail: getMediumResThumbnailFromCandidates(entry.thumbnails, entry.thumbnail ?? ""),
        author:
            (entry.artist ?? entry.uploader ?? entry.channel ?? entry.creator)?.trim() || undefined,
        isLive: isLiveEntry(entry),
        ...overrides,
    };
}

function withYouTubeMusicDisplayUrl(song: Song, sourceUrl: string): Song {
    if (!isYouTubeMusicUrl(sourceUrl)) {
        return song;
    }

    const videoId = extractYouTubeVideoIdFromSong(song);
    const musicUrl = videoId === null ? sourceUrl : `https://music.youtube.com/watch?v=${videoId}`;
    const dumpUrl = song.url?.trim() ?? "";
    const playableUrl =
        song.playableUrl?.trim() ||
        (dumpUrl.length > 0 && dumpUrl !== musicUrl ? dumpUrl : undefined);
    if (song.url === musicUrl && song.playableUrl === playableUrl) {
        return song;
    }

    return {
        ...song,
        url: musicUrl,
        playableUrl,
    };
}

function playlistMetadataFromDump(
    dump: YtDlpDumpEntry,
    url: string,
    skippedCount: number,
    skippedReason?: PlaylistMetadata["skippedReason"],
): PlaylistMetadata {
    return {
        title: (dump.playlist_title ?? dump.title ?? dump.playlist ?? "Playlist").trim(),
        url: (dump.webpage_url ?? dump.original_url ?? url).trim(),
        thumbnail: getMediumResThumbnailFromCandidates(dump.thumbnails, dump.thumbnail ?? ""),
        author: (dump.uploader ?? dump.channel ?? dump.artist)?.trim() || undefined,
        skippedCount: skippedCount > 0 ? skippedCount : undefined,
        skippedReason: skippedCount > 0 ? (skippedReason ?? "unavailable") : undefined,
    };
}

export async function dumpYtDlpMetadata(
    url: string,
    options: {
        flatPlaylist?: boolean;
        noPlaylist?: boolean;
        yesPlaylist?: boolean;
        playlistEnd?: number;
        playlistStart?: number;
    } = {},
): Promise<YtDlpDumpEntry> {
    const dump = await ytdl(url, {
        ...DUMP_OPTIONS,
        ...(options.flatPlaylist === true ? { flatPlaylist: true } : {}),
        ...(options.noPlaylist === true ? { noPlaylist: true } : {}),
        ...(options.yesPlaylist === true ? { yesPlaylist: true } : {}),
        ...(options.playlistEnd === undefined ? {} : { playlistEnd: options.playlistEnd }),
        ...(options.playlistStart === undefined ? {} : { playlistStart: options.playlistStart }),
    });

    const entry = asDumpEntry(dump);
    if (entry === null) {
        throw new Error(`yt-dlp returned unusable metadata for ${url}`);
    }

    return entry;
}

export function songsFromDump(
    dump: YtDlpDumpEntry,
    sourceUrl: string,
): { items: Song[]; playlist?: PlaylistMetadata } {
    const nestedEntries = dump.entries;
    if (Array.isArray(nestedEntries) || dump._type === "playlist") {
        const items: Song[] = [];
        let skippedCount = 0;
        for (const nested of nestedEntries ?? []) {
            if (nested === null) {
                skippedCount += 1;
                continue;
            }

            const song = mapDumpEntryToSong(nested);
            if (song === null) {
                skippedCount += 1;
                continue;
            }

            items.push(withYouTubeMusicDisplayUrl(song, sourceUrl));
        }

        return {
            items,
            playlist: playlistMetadataFromDump(dump, sourceUrl, skippedCount),
        };
    }

    const song = mapDumpEntryToSong(dump);
    return {
        items: song === null ? [] : [withYouTubeMusicDisplayUrl(song, sourceUrl)],
    };
}

export async function searchExtractorTracks(
    query: string,
    source: "soundcloud" | "youtube",
    limit = 10,
    provider: SearchProvider = "dsp",
): Promise<SearchTrackResult> {
    if (source === "youtube" && provider === "dsp") {
        try {
            const items = await searchYouTubeMusic(query, limit);
            if (items.length > 0) {
                return {
                    type: "selection",
                    items,
                };
            }
        } catch {}
    }

    const prefix = source === "soundcloud" ? "scsearch" : "ytsearch";
    const dump = await dumpYtDlpMetadata(`${prefix}${limit}:${query}`, {
        flatPlaylist: true,
        playlistEnd: limit,
    });
    const { items } = songsFromDump(dump, query);

    return {
        type: "selection",
        items,
    };
}

export async function resolveExtractorUrl(
    url: string,
    type: "artist" | "playlist" | "track" | "unknown" | undefined,
): Promise<SearchTrackResult> {
    const isCollection = type === "playlist" || type === "artist";
    const dump = await dumpYtDlpMetadata(url, {
        flatPlaylist: isCollection,
        yesPlaylist: isCollection,
        noPlaylist: !isCollection,
    });
    const resolved = songsFromDump(dump, url);

    return {
        type: "results",
        items: resolved.items,
        playlist: isCollection ? resolved.playlist : undefined,
    };
}

export async function resolveUnknownUrl(url: string): Promise<SearchTrackResult> {
    try {
        return await resolveExtractorUrl(url, "unknown");
    } catch {
        let title = url;
        try {
            const parsed = new URL(url);
            const fileName = parsed.pathname.split("/").filter(Boolean).at(-1);
            if (fileName) {
                title = decodeURIComponent(fileName);
            }
        } catch {}

        return {
            type: "results",
            items: [
                {
                    id: url,
                    title,
                    url,
                    duration: 0,
                    thumbnail: "",
                },
            ],
        };
    }
}

export async function hydrateFromDump(song: Song): Promise<Song | undefined> {
    const sourceUrl = song.playableUrl?.trim() || song.url;
    if (sourceUrl.length === 0) {
        return undefined;
    }

    const dump = await dumpYtDlpMetadata(sourceUrl, { noPlaylist: true });
    const resolved = mapDumpEntryToSong(dump);
    if (resolved === null) {
        return undefined;
    }

    return {
        ...song,
        id: resolved.id || song.id,
        title: resolved.title || song.title,
        duration: resolved.duration > 0 ? resolved.duration : song.duration,
        thumbnail: shouldKeepExistingThumbnail(song.thumbnail)
            ? getMediumResThumbnail(song.thumbnail)
            : resolved.thumbnail || song.thumbnail,
        author: resolved.author ?? song.author,
        isLive: resolved.isLive ?? song.isLive,
        playableUrl: song.playableUrl ?? (resolved.url === song.url ? undefined : resolved.url),
    };
}

export function logYtDlpFailure(client: Rawon, context: string, error: unknown): void {
    client.logger.debug(`[${context}] yt-dlp lookup failed`, {
        error: error instanceof Error ? error.message : String(error),
    });
}
