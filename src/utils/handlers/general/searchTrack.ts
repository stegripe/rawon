import { URL } from "node:url";
import { type Rawon } from "../../../structures/Rawon.js";
import {
    type SearchTrackResult,
    type Song,
    type SpotifyResolveResult,
    type SpotifyTrack,
} from "../../../typings/index.js";
import { chunk } from "../../functions/chunk.js";
import { getMaxResThumbnail, getSoundCloudThumbnail } from "../../functions/getMaxResThumbnail.js";
import { getInfo } from "../YTDLUtil.js";
import { checkQuery } from "./checkQuery.js";

const SPOTIFY_MATCH_IGNORE_TOKENS = new Set([
    "audio",
    "clip",
    "edit",
    "explicit",
    "extended",
    "hd",
    "hq",
    "live",
    "lyric",
    "lyrics",
    "mv",
    "official",
    "performance",
    "remaster",
    "remastered",
    "remix",
    "short",
    "video",
    "visualizer",
]);

function normalizeSpotifyMatchText(value: string): string {
    return value
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/gu, "")
        .replace(/&/gu, " and ")
        .replace(/[()[\]]/gu, " ")
        .toLowerCase()
        .replace(/[^a-z0-9]+/gu, " ")
        .trim();
}

function significantTokens(value: string): string[] {
    return normalizeSpotifyMatchText(value)
        .split(/\s+/u)
        .filter((token) => token.length > 1 && !SPOTIFY_MATCH_IGNORE_TOKENS.has(token));
}

function tokenCoverage(tokens: string[], haystack: Set<string>): number {
    if (tokens.length === 0) {
        return 1;
    }

    let matched = 0;
    for (const token of tokens) {
        if (haystack.has(token)) {
            matched++;
        }
    }
    return matched / tokens.length;
}

function isDurationClose(spotifyDurationMs: number, candidateDurationSeconds: number): boolean {
    if (spotifyDurationMs <= 0 || candidateDurationSeconds <= 0) {
        return true;
    }

    const spotifyDurationSeconds = spotifyDurationMs / 1_000;
    const diff = Math.abs(spotifyDurationSeconds - candidateDurationSeconds);
    return diff <= Math.max(12, spotifyDurationSeconds * 0.08);
}

function isSpotifyCandidateMatch(track: SpotifyTrack, candidate: Song): boolean {
    const candidateTokens = new Set(
        significantTokens(`${candidate.title} ${candidate.author ?? ""}`),
    );
    const titleTokens = significantTokens(track.name);
    const titleCoverage = tokenCoverage(titleTokens, candidateTokens);

    const requiredTitleCoverage = titleTokens.length <= 2 ? 1 : 0.8;
    if (titleCoverage < requiredTitleCoverage) {
        return false;
    }

    const artistMatches = track.artists.some((artist) => {
        const artistTokens = significantTokens(artist.name);
        if (artistTokens.length === 0) {
            return false;
        }
        return (
            tokenCoverage(artistTokens, candidateTokens) >= (artistTokens.length <= 2 ? 1 : 0.67)
        );
    });

    if (!artistMatches) {
        return false;
    }

    return isDurationClose(track.duration_ms, candidate.duration);
}

type SoundCloudTrackLike = {
    artwork_url?: string | null;
    duration?: number;
    full_duration?: number;
    id: number | string;
    permalink_url?: string;
    title?: string;
    user?: {
        avatar_url?: string | null;
        username?: string;
    };
};

type SoundCloudPlaylistLike = {
    artwork_url?: string | null;
    permalink_url: string;
    title: string;
    tracks: SoundCloudTrackLike[];
    user?: {
        avatar_url?: string | null;
        username?: string;
    };
};

function isResolvedSoundCloudTrack(
    track: SoundCloudTrackLike,
): track is SoundCloudTrackLike & { permalink_url: string; title: string } {
    return (track.title?.length ?? 0) > 0 && (track.permalink_url?.length ?? 0) > 0;
}

function mapSoundCloudTrack(
    track: SoundCloudTrackLike & { permalink_url: string; title: string },
): Song {
    return {
        duration: track.full_duration ?? track.duration ?? 0,
        id: track.id.toString(),
        thumbnail: getSoundCloudThumbnail(track.artwork_url ?? track.user?.avatar_url),
        title: track.title,
        url: track.permalink_url,
    };
}

async function resolveSoundCloudFromApi(
    client: Rawon,
    url: string,
): Promise<SoundCloudPlaylistLike | SoundCloudTrackLike> {
    return client.soundcloud.api.getV2("/resolve", { url }) as Promise<
        SoundCloudPlaylistLike | SoundCloudTrackLike
    >;
}

async function hydrateSoundCloudPlaylist(
    client: Rawon,
    playlist: SoundCloudPlaylistLike,
): Promise<SoundCloudPlaylistLike> {
    const missingIds = playlist.tracks
        .filter((track) => !isResolvedSoundCloudTrack(track))
        .map((track) => Number(track.id))
        .filter((id) => Number.isFinite(id));
    if (missingIds.length === 0) {
        return playlist;
    }

    const hydratedTracks = (await client.soundcloud.tracks.getArray(
        missingIds,
        true,
    )) as SoundCloudTrackLike[];
    const hydratedByID = new Map(
        hydratedTracks.map((track) => [track.id.toString(), track] as const),
    );

    return {
        ...playlist,
        tracks: playlist.tracks.map((track) => hydratedByID.get(track.id.toString()) ?? track),
    };
}

export async function searchTrack(
    client: Rawon,
    query: string,
    source: "soundcloud" | "youtube" | undefined = "youtube",
): Promise<SearchTrackResult> {
    const result: SearchTrackResult = {
        items: [],
    };

    const queryData = checkQuery(query);
    if (queryData.isURL) {
        const url = new URL(query);
        result.type = "results";

        switch (queryData.sourceType) {
            case "soundcloud": {
                let scUrl = url;
                if (["www.soundcloud.app.goo.gl", "soundcloud.app.goo.gl"].includes(url.hostname)) {
                    const req = await client.request.get(url.toString());
                    scUrl = new URL(req.url);
                }
                scUrl.search = "";
                scUrl.hash = "";

                const newQueryData = checkQuery(scUrl.toString());
                switch (newQueryData.type) {
                    case "track": {
                        const track = await client.soundcloud.tracks
                            .get(scUrl.toString())
                            .catch(() => resolveSoundCloudFromApi(client, scUrl.toString()));

                        const resolvedTrack = track as SoundCloudTrackLike;
                        if (isResolvedSoundCloudTrack(resolvedTrack)) {
                            result.items = [mapSoundCloudTrack(resolvedTrack)];
                        }
                        break;
                    }

                    case "playlist": {
                        const playlist = (await client.soundcloud.playlists
                            .get(scUrl.toString())
                            .catch(() =>
                                resolveSoundCloudFromApi(client, scUrl.toString()),
                            )) as SoundCloudPlaylistLike;
                        const hydratedPlaylist = await hydrateSoundCloudPlaylist(client, playlist);
                        const tracks = hydratedPlaylist.tracks
                            .filter(isResolvedSoundCloudTrack)
                            .map(mapSoundCloudTrack);

                        result.items = tracks;
                        result.playlist = {
                            title: hydratedPlaylist.title,
                            url: hydratedPlaylist.permalink_url,
                            thumbnail:
                                getSoundCloudThumbnail(
                                    hydratedPlaylist.artwork_url ??
                                        hydratedPlaylist.user?.avatar_url,
                                ) || undefined,
                            author: hydratedPlaylist.user?.username,
                        };
                        break;
                    }

                    default:
                        break;
                }

                break;
            }

            case "youtube": {
                try {
                    return await client.license.resolveMusic(query);
                } catch (error) {
                    if (queryData.type !== "track") {
                        throw error;
                    }
                    const info = await getInfo(query, client);
                    result.items = [
                        {
                            duration: info.is_live ? 0 : info.duration,
                            id: info.id,
                            thumbnail: getMaxResThumbnail(
                                info.thumbnails?.sort(
                                    (a, b) => b.height * b.width - a.height * a.width,
                                )[0]?.url ?? "",
                            ),
                            title: info.title,
                            url: info.url,
                            isLive: info.is_live,
                        },
                    ];
                }
                break;
            }

            case "spotify": {
                async function resolveSpotifyTrack(
                    track: SpotifyTrack,
                    exhaustive = true,
                ): Promise<Song | null> {
                    const artistNames = track.artists.map((artist) => artist.name).join(", ");
                    const queries = [
                        artistNames.length > 0 ? `${artistNames} - ${track.name}` : undefined,
                        exhaustive ? track.external_ids?.isrc : undefined,
                        artistNames.length > 0 ? `${track.name} ${artistNames}` : track.name,
                    ].filter((query): query is string => (query?.trim().length ?? 0) > 0);
                    const uniqueQueries = [...new Set(queries)];

                    for (const query of uniqueQueries) {
                        try {
                            const response = await client.license.searchMusic(query);
                            const match = response.items.find((item) =>
                                isSpotifyCandidateMatch(track, item),
                            );
                            if (match) {
                                return match;
                            }
                        } catch (error) {
                            client.logger.debug(
                                `[Spotify] Failed resolving "${track.name}" with query "${query}": ${(error as Error).message}`,
                            );
                        }
                    }

                    return null;
                }

                switch (queryData.type) {
                    case "track": {
                        const songData = (await client.spotify.resolveTracks(
                            url.toString(),
                        )) as SpotifyTrack;
                        const resolved = await resolveSpotifyTrack(songData);
                        if (resolved !== null) {
                            result.items = [resolved];
                        }
                        break;
                    }

                    case "artist":
                    case "playlist": {
                        const spotifyResult = (await client.spotify.resolveTracksWithMetadata(
                            url.toString(),
                        )) as SpotifyResolveResult;
                        const songs = spotifyResult.tracks;
                        const trackResults: Song[] = [];
                        const batches = chunk(songs, 20);
                        for (const batch of batches) {
                            const batchResults = await Promise.all(
                                batch.map(async (x): Promise<Song | null> => {
                                    if (!x.track) {
                                        return null;
                                    }
                                    return resolveSpotifyTrack(x.track, false);
                                }),
                            );
                            trackResults.push(...batchResults.filter((x): x is Song => x !== null));
                        }
                        result.items = trackResults;
                        if (spotifyResult.metadata) {
                            const skippedCount = songs.length - trackResults.length;
                            result.playlist = {
                                ...spotifyResult.metadata,
                                skippedCount:
                                    (spotifyResult.metadata.skippedCount ?? 0) + skippedCount,
                                skippedReason:
                                    skippedCount > 0
                                        ? "unresolved"
                                        : spotifyResult.metadata.skippedReason,
                            };
                        }
                        break;
                    }

                    default:
                        break;
                }

                break;
            }

            default: {
                const info = await getInfo(url.toString(), client).catch(() => void 0);

                result.items = [
                    {
                        duration: info?.is_live ? 0 : (info?.duration ?? 0),
                        id: info?.id ?? "",
                        thumbnail: getMaxResThumbnail(
                            info?.thumbnails?.sort(
                                (a, b) => b.height * b.width - a.height * a.width,
                            )[0].url ?? "",
                        ),
                        title: info?.title ?? "Unknown Song",
                        url: info?.url ?? url.toString(),
                        isLive: info?.is_live,
                    },
                ];
                break;
            }
        }
    } else {
        result.type = "selection";

        if (source === "soundcloud") {
            const searchRes = await client.soundcloud.tracks.search({
                q: query,
            });
            const tracks = searchRes.collection.map(
                (track): Song => ({
                    duration: track.full_duration,
                    id: track.id.toString(),
                    thumbnail: getSoundCloudThumbnail(track.artwork_url ?? track.user?.avatar_url),
                    title: track.title,
                    url: track.permalink_url,
                }),
            );

            result.items = tracks;
        } else {
            return client.license.searchMusic(query);
        }
    }

    return result;
}
