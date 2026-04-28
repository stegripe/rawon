import { URL } from "node:url";
import { Playlist, type SearchResult, type Video, type VideoCompact } from "youtubei";
import { type Rawon } from "../../../structures/Rawon.js";
import {
    type PlaylistMetadata,
    type SearchTrackResult,
    type Song,
    type SpotifyResolveResult,
    type SpotifyTrack,
} from "../../../typings/index.js";
import { chunk } from "../../functions/chunk.js";
import {
    getMaxResThumbnail,
    getSoundCloudThumbnail,
    getYouTubeThumbnail,
} from "../../functions/getMaxResThumbnail.js";
import { youtube, youtubeMusic } from "../YouTubeUtil.js";
import { getInfo } from "../YTDLUtil.js";
import { checkQuery } from "./checkQuery.js";

function extractVideoId(url: URL): string | null {
    if (/youtu\.be/gu.test(url.hostname)) {
        return url.pathname.replace("/", "");
    }
    if (url.pathname.startsWith("/shorts/")) {
        return url.pathname.replace("/shorts/", "").split("/")[0];
    }
    if (url.pathname.startsWith("/live/")) {
        return url.pathname.replace("/live/", "").split("/")[0];
    }
    return url.searchParams.get("v");
}

async function loadAllPlaylistVideos(client: Rawon, playlist: Playlist): Promise<void> {
    const maxIterations = 50;
    const maxStagnant = 3;
    let iterations = 0;
    let stagnant = 0;
    let lastCount = playlist.videos.items.length;

    while (playlist.videos.continuation && iterations < maxIterations && stagnant < maxStagnant) {
        try {
            await playlist.videos.next();
        } catch (error) {
            client.logger.warn(
                `[searchTrack] Failed to load playlist continuation: ${(error as Error).message}`,
            );
            break;
        }

        const currentCount = playlist.videos.items.length;
        if (currentCount > lastCount) {
            lastCount = currentCount;
            stagnant = 0;
        } else {
            stagnant += 1;
        }
        iterations += 1;
    }
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

                    for (const key of scUrl.searchParams.keys()) {
                        scUrl.searchParams.delete(key);
                    }
                }

                const newQueryData = checkQuery(scUrl.toString());
                switch (newQueryData.type) {
                    case "track": {
                        const track = await client.soundcloud.tracks.get(scUrl.toString());

                        result.items = [
                            {
                                duration: track.full_duration,
                                id: track.id.toString(),
                                thumbnail: getSoundCloudThumbnail(
                                    track.artwork_url ?? track.user?.avatar_url,
                                ),
                                title: track.title,
                                url: track.permalink_url,
                            },
                        ];
                        break;
                    }

                    case "playlist": {
                        const playlist = await client.soundcloud.playlists.get(scUrl.toString());
                        const tracks = playlist.tracks.map(
                            (track): Song => ({
                                duration: track.full_duration,
                                id: track.id.toString(),
                                thumbnail: getSoundCloudThumbnail(
                                    track.artwork_url ?? track.user?.avatar_url,
                                ),
                                title: track.title,
                                url: track.permalink_url,
                            }),
                        );

                        result.items = tracks;
                        result.playlist = {
                            title: playlist.title,
                            url: playlist.permalink_url,
                            thumbnail:
                                getSoundCloudThumbnail(
                                    playlist.artwork_url ?? playlist.user?.avatar_url,
                                ) || undefined,
                            author: playlist.user?.username,
                        };
                        break;
                    }

                    default:
                        break;
                }

                break;
            }

            case "youtube": {
                switch (queryData.type) {
                    case "track": {
                        const videoId = extractVideoId(url);
                        if (videoId === null || videoId.length === 0) {
                            break;
                        }

                        try {
                            const track = await youtube.getVideo(videoId);
                            if (track) {
                                result.items = [
                                    {
                                        duration: track.isLiveContent
                                            ? 0
                                            : (track as Video).duration,
                                        id: track.id,
                                        thumbnail: getYouTubeThumbnail(track.id),
                                        title: track.title,
                                        url: `https://youtube.com/watch?v=${track.id}`,
                                        isLive: track.isLiveContent,
                                    },
                                ];
                            }
                        } catch {
                            try {
                                const videoUrl = `https://youtube.com/watch?v=${videoId}`;
                                const videoInfo = await getInfo(videoUrl, client);

                                if (videoInfo?.id) {
                                    result.items = [
                                        {
                                            duration: videoInfo.is_live
                                                ? 0
                                                : (videoInfo.duration ?? 0),
                                            id: videoInfo.id,
                                            thumbnail: getYouTubeThumbnail(videoInfo.id),
                                            title: videoInfo.title ?? "Unknown",
                                            url: videoInfo.url ?? videoUrl,
                                            isLive: videoInfo.is_live,
                                        },
                                    ];
                                }
                            } catch {}
                        }
                        break;
                    }

                    case "playlist": {
                        const list = url.searchParams.get("list") ?? "";
                        const playlist = await youtube.getPlaylist(list);
                        const songIndex = url.searchParams.get("index");
                        let temp = null;

                        if (playlist) {
                            if (playlist instanceof Playlist && playlist.videos.continuation) {
                                client.logger.info(
                                    `[searchTrack] Loading all videos from YouTube playlist "${playlist.title}" (${playlist.videoCount} videos)...`,
                                );
                                try {
                                    await loadAllPlaylistVideos(client, playlist);
                                    client.logger.info(
                                        `[searchTrack] Loaded ${playlist.videos.items.length} videos from playlist "${playlist.title}"`,
                                    );
                                } catch (error) {
                                    client.logger.warn(
                                        `[searchTrack] Failed to load all playlist videos: ${(error as Error).message}`,
                                    );
                                }
                            }

                            const rawTracks = (
                                playlist instanceof Playlist
                                    ? playlist.videos.items
                                    : playlist.videos
                            ).filter((track) => (track?.id?.length ?? 0) > 0);

                            const tracks = rawTracks.map(
                                (track): Song => ({
                                    duration: track.duration ?? 0,
                                    id: track.id,
                                    thumbnail: getYouTubeThumbnail(track.id),
                                    title: track.title,
                                    url: `https://youtube.com/watch?v=${track.id}`,
                                }),
                            );

                            if ((songIndex?.length ?? 0) > 0) {
                                const parsedIndex = Number.parseInt(songIndex ?? "", 10);
                                if (parsedIndex > 0 && parsedIndex <= tracks.length) {
                                    temp = tracks.splice(parsedIndex - 1, 1)[0];
                                }
                            }
                            if (temp) {
                                tracks.unshift(temp);
                            }

                            result.items = tracks;

                            const playlistMeta: PlaylistMetadata = {
                                title: playlist.title,
                                url: `https://youtube.com/playlist?list=${list}`,
                            };
                            if (playlist instanceof Playlist) {
                                playlistMeta.thumbnail = playlist.thumbnails?.[0]?.url;
                                playlistMeta.author = playlist.channel?.name;
                            }
                            result.playlist = playlistMeta;
                        }
                        break;
                    }

                    default:
                        break;
                }

                break;
            }

            case "spotify": {
                function sortVideos(
                    track: SpotifyTrack,
                    videos: SearchResult<"video">,
                ): VideoCompact[] {
                    return videos.items.sort((a, b) => {
                        let aValue = 0;
                        let bValue = 0;
                        const aDurationDiff =
                            (a.duration ?? 0) > 0 ? (a.duration ?? 0) - track.duration_ms : null;
                        const bDurationDiff =
                            (b.duration ?? 0) > 0 ? (b.duration ?? 0) - track.duration_ms : null;

                        if (a.title.toLowerCase().includes(track.name.toLowerCase())) {
                            aValue--;
                        }
                        if (
                            track.artists.some(
                                (x) => a.channel?.name.toLowerCase().includes(x.name) === true,
                            )
                        ) {
                            aValue--;
                        }
                        if (a.channel?.name.endsWith("- Topic") === true) {
                            aValue -= 2;
                        }
                        if (
                            aDurationDiff !== null &&
                            aDurationDiff <= 5_000 &&
                            aDurationDiff >= -5_000
                        ) {
                            aValue -= 2;
                        }

                        if (b.title.toLowerCase().includes(track.name.toLowerCase())) {
                            bValue++;
                        }
                        if (
                            track.artists.some(
                                (x) => b.channel?.name.toLowerCase().includes(x.name) === true,
                            )
                        ) {
                            bValue++;
                        }
                        if (b.channel?.name.endsWith(" - Topic") === true) {
                            bValue += 2;
                        }
                        if (
                            bDurationDiff !== null &&
                            bDurationDiff <= 5_000 &&
                            bDurationDiff >= -5_000
                        ) {
                            bValue += 2;
                        }

                        return aValue + bValue;
                    });
                }

                async function resolveSpotifyTrack(track: SpotifyTrack): Promise<Song | null> {
                    try {
                        let response = await youtube.search(
                            track.external_ids?.isrc ??
                                `${track.artists.map((y) => y.name).join(", ")} - ${track.name}`,
                            { type: "video" },
                        );
                        if (response.items.length === 0) {
                            response = await youtube.search(
                                `${track.artists.map((y) => y.name).join(", ")} - ${track.name}`,
                                { type: "video" },
                            );
                        }

                        const matches = sortVideos(track, response);
                        if (matches.length === 0) {
                            return null;
                        }

                        return {
                            duration: matches[0].duration ?? 0,
                            id: matches[0].id,
                            thumbnail: getYouTubeThumbnail(matches[0].id),
                            title: matches[0].title,
                            url: `https://youtube.com/watch?v=${matches[0].id}`,
                        };
                    } catch {
                        return null;
                    }
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
                        const batches = chunk(songs, 5);
                        for (const batch of batches) {
                            const batchResults = await Promise.all(
                                batch.map(async (x): Promise<Song | null> => {
                                    if (!x.track) {
                                        return null;
                                    }
                                    return resolveSpotifyTrack(x.track);
                                }),
                            );
                            trackResults.push(...batchResults.filter((x): x is Song => x !== null));
                        }
                        result.items = trackResults;
                        if (spotifyResult.metadata) {
                            result.playlist = spotifyResult.metadata;
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
            try {
                const musicSearchRes = await youtubeMusic.search(query, "song");
                if (musicSearchRes.items.length > 0) {
                    const tracks = musicSearchRes.items.map(
                        (track): Song => ({
                            duration: track.duration ?? 0,
                            id: track.id,
                            thumbnail: getYouTubeThumbnail(track.id),
                            title: track.title,
                            url: `https://youtube.com/watch?v=${track.id}`,
                        }),
                    );
                    result.items = tracks;
                } else {
                    const searchRes = await youtube.search(query, { type: "video" });
                    const tracks = searchRes.items.map(
                        (track): Song => ({
                            duration: track.duration ?? 0,
                            id: track.id,
                            thumbnail: getYouTubeThumbnail(track.id),
                            title: track.title,
                            url: `https://youtube.com/watch?v=${track.id}`,
                        }),
                    );
                    result.items = tracks;
                }
            } catch {
                try {
                    const searchRes = await youtube.search(query, { type: "video" });
                    const tracks = searchRes.items.map(
                        (track): Song => ({
                            duration: track.duration ?? 0,
                            id: track.id,
                            thumbnail: getYouTubeThumbnail(track.id),
                            title: track.title,
                            url: `https://youtube.com/watch?v=${track.id}`,
                        }),
                    );
                    result.items = tracks;
                } catch {}
            }
        }
    }

    return result;
}
