import { Buffer } from "node:buffer";
import { clientId, clientSecret } from "../../../config/env.js";
import { type Rawon } from "../../../structures/Rawon.js";
import {
    type PlaylistMetadata,
    type SearchProvider,
    type SearchTrackResult,
    type Song,
    type SpotifyAlbum,
    type SpotifyPlaylist,
    type SpotifyTrack,
} from "../../../typings/index.js";
import { getMediumResThumbnailFromCandidates } from "../../functions/getMaxResThumbnail.js";
import { resolveSearchProvider } from "../../functions/searchProvider.js";
import { searchYouTubeMusic } from "./youtubeMusicSearch.js";
import { dumpYtDlpMetadata, mapDumpEntryToSong } from "./ytdlpMetadata.js";

const SPOTIFY_API_BASE = "https://api.spotify.com/v1";
const YOUTUBE_SEARCH_CONCURRENCY = 4;

type SpotifyToken = {
    accessToken: string;
    expiresAt: number;
};

type SpotifyPaging<T> = {
    items: T[];
    next: string | null;
};

let cachedToken: SpotifyToken | null = null;

function hasSpotifyCredentials(): boolean {
    return clientId.length > 0 && clientSecret.length > 0;
}

function parseSpotifyResource(
    url: string,
): { type: "album" | "artist" | "playlist" | "track"; id: string } | null {
    try {
        const parsed = new URL(url);
        if (!parsed.hostname.endsWith("spotify.com")) {
            return null;
        }

        const segments = parsed.pathname.split("/").filter(Boolean);
        const typeIndex = segments.findIndex((segment) =>
            ["album", "artist", "playlist", "track"].includes(segment),
        );
        if (typeIndex === -1) {
            return null;
        }

        const type = segments[typeIndex] as "album" | "artist" | "playlist" | "track";
        const id = (segments[typeIndex + 1] ?? "").split("?")[0];
        if (id.length === 0) {
            return null;
        }

        return { type, id };
    } catch {
        return null;
    }
}

async function getSpotifyAccessToken(client: Rawon): Promise<string> {
    if (cachedToken && cachedToken.expiresAt > Date.now() + 5_000) {
        return cachedToken.accessToken;
    }

    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
    const response = await client.request
        .post("https://accounts.spotify.com/api/token", {
            headers: {
                Authorization: `Basic ${credentials}`,
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: "grant_type=client_credentials",
        })
        .json<{ access_token?: string; expires_in?: number }>();

    if (!response.access_token) {
        throw new Error("Failed to obtain Spotify access token.");
    }

    cachedToken = {
        accessToken: response.access_token,
        expiresAt: Date.now() + Math.max((response.expires_in ?? 3600) - 30, 30) * 1_000,
    };

    return cachedToken.accessToken;
}

async function spotifyGet<T>(client: Rawon, path: string): Promise<T> {
    const token = await getSpotifyAccessToken(client);
    return client.request
        .get(path.startsWith("http") ? path : `${SPOTIFY_API_BASE}${path}`, {
            headers: { Authorization: `Bearer ${token}` },
        })
        .json<T>();
}

async function collectPaging<T>(
    client: Rawon,
    firstPath: string,
    readItems: (page: unknown) => T[],
): Promise<T[]> {
    const items: T[] = [];
    let next: string | null = firstPath.startsWith("http")
        ? firstPath
        : `${SPOTIFY_API_BASE}${firstPath}`;

    while (next) {
        const page: SpotifyPaging<unknown> = await spotifyGet<SpotifyPaging<unknown>>(client, next);
        items.push(...readItems(page));
        next = typeof page.next === "string" ? page.next : null;
    }

    return items;
}

function bestSpotifyImage(
    images: { url?: string; height?: number | null; width?: number | null }[] | undefined,
): string {
    return getMediumResThumbnailFromCandidates(images);
}

function trackAlbumArt(track: SpotifyTrack): string {
    return bestSpotifyImage(track.album?.images);
}

function trackSearchQuery(track: SpotifyTrack): string {
    const artists = track.artists
        .map((artist) => artist.name)
        .filter(Boolean)
        .join(" ");
    return [track.name, artists].filter((part) => part.length > 0).join(" ");
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

function withSpotifyDisplay(track: SpotifyTrack, youtubeSong: Song): Song {
    return {
        ...youtubeSong,
        title: track.name || youtubeSong.title,
        author:
            track.artists
                .map((artist) => artist.name)
                .filter(Boolean)
                .join(", ") || youtubeSong.author,
        url: track.external_urls.spotify,
        playableUrl: youtubeSong.url,
        thumbnail: trackAlbumArt(track) || youtubeSong.thumbnail,
        duration:
            youtubeSong.duration > 0
                ? youtubeSong.duration
                : Math.round((track.duration_ms ?? 0) / 1_000),
    };
}

async function resolveTrackToYouTube(
    track: SpotifyTrack,
    provider: SearchProvider,
): Promise<Song | null> {
    const query = trackSearchQuery(track);
    if (query.length === 0) {
        return null;
    }

    if (provider === "dsp") {
        try {
            const items = await searchYouTubeMusic(query, 1);
            const youtubeSong = items[0];
            if (youtubeSong !== undefined) {
                return withSpotifyDisplay(track, youtubeSong);
            }
        } catch {}
    }

    try {
        const dump = await dumpYtDlpMetadata(`ytsearch1:${query}`, {
            flatPlaylist: true,
            playlistEnd: 1,
        });
        const entry = dump.entries?.[0] ?? (dump._type === "playlist" ? null : dump);
        if (entry === null || entry === undefined) {
            return null;
        }

        const youtubeSong = mapDumpEntryToSong(entry);
        if (youtubeSong === null) {
            return null;
        }

        return withSpotifyDisplay(track, youtubeSong);
    } catch {
        return null;
    }
}

async function resolveTracks(
    tracks: SpotifyTrack[],
    provider: SearchProvider,
): Promise<{ items: Song[]; skippedCount: number }> {
    const resolved = await mapWithConcurrency(tracks, YOUTUBE_SEARCH_CONCURRENCY, async (track) =>
        resolveTrackToYouTube(track, provider),
    );
    const items = resolved.filter((song): song is Song => song !== null);

    return {
        items,
        skippedCount: tracks.length - items.length,
    };
}

export async function resolveSpotifyUrl(client: Rawon, url: string): Promise<SearchTrackResult> {
    if (!hasSpotifyCredentials()) {
        throw new Error("Spotify support requires SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET.");
    }

    const provider = resolveSearchProvider(client);
    const resource = parseSpotifyResource(url);
    if (resource === null) {
        throw new Error("Invalid Spotify URL.");
    }

    if (resource.type === "track") {
        const track = await spotifyGet<SpotifyTrack>(client, `/tracks/${resource.id}`);
        const { items, skippedCount } = await resolveTracks([track], provider);
        if (items.length === 0) {
            throw new Error("Could not resolve this Spotify track to a playable source.");
        }

        return {
            type: "results",
            items,
            playlist:
                skippedCount > 0
                    ? {
                          title: track.name,
                          url: track.external_urls.spotify,
                          skippedCount,
                          skippedReason: "unresolved",
                      }
                    : undefined,
        };
    }

    if (resource.type === "playlist") {
        const playlist = await spotifyGet<SpotifyPlaylist>(client, `/playlists/${resource.id}`);
        const playlistTracks = await collectPaging<{ track: SpotifyTrack | null }>(
            client,
            `/playlists/${resource.id}/tracks?limit=100`,
            (page) => (page as SpotifyPaging<{ track: SpotifyTrack | null }>).items ?? [],
        );
        const tracks = playlistTracks
            .map((item) => item.track)
            .filter(
                (track): track is SpotifyTrack => track !== null && typeof track.id === "string",
            );
        const { items, skippedCount } = await resolveTracks(tracks, provider);
        const metadata: PlaylistMetadata = {
            title: playlist.name,
            url: playlist.external_urls.spotify,
            thumbnail: bestSpotifyImage(playlist.images) || undefined,
            author: playlist.owner?.display_name,
            skippedCount: skippedCount > 0 ? skippedCount : undefined,
            skippedReason: skippedCount > 0 ? "unresolved" : undefined,
        };

        return { type: "results", items, playlist: metadata };
    }

    if (resource.type === "album") {
        const album = await spotifyGet<SpotifyAlbum>(client, `/albums/${resource.id}`);
        const albumTracks = await collectPaging<SpotifyTrack>(
            client,
            `/albums/${resource.id}/tracks?limit=50`,
            (page) => (page as SpotifyPaging<SpotifyTrack>).items ?? [],
        );
        const tracks = albumTracks.map((track) => ({
            ...track,
            album: track.album ?? { images: album.images },
            external_urls: track.external_urls ?? { spotify: url },
            artists: (track.artists?.length ?? 0) > 0 ? track.artists : (album.artists ?? []),
        }));
        const { items, skippedCount } = await resolveTracks(tracks, provider);
        const metadata: PlaylistMetadata = {
            title: album.name,
            url: album.external_urls.spotify,
            thumbnail: bestSpotifyImage(album.images) || undefined,
            author: album.artists
                ?.map((artist) => artist.name)
                .filter(Boolean)
                .join(", "),
            skippedCount: skippedCount > 0 ? skippedCount : undefined,
            skippedReason: skippedCount > 0 ? "unresolved" : undefined,
        };

        return { type: "results", items, playlist: metadata };
    }

    const artist = await spotifyGet<{ name: string; id: string }>(
        client,
        `/artists/${resource.id}`,
    );
    const topTracks = await spotifyGet<{ tracks: SpotifyTrack[] }>(
        client,
        `/artists/${resource.id}/top-tracks?market=US`,
    );
    const { items, skippedCount } = await resolveTracks(topTracks.tracks ?? [], provider);
    const metadata: PlaylistMetadata = {
        title: artist.name,
        url,
        author: artist.name,
        skippedCount: skippedCount > 0 ? skippedCount : undefined,
        skippedReason: skippedCount > 0 ? "unresolved" : undefined,
    };

    return { type: "results", items, playlist: metadata };
}
