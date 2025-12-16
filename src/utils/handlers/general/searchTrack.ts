import { URL } from "node:url";
import { Playlist, type SearchResult, type Video, type VideoCompact } from "youtubei";
import { type Rawon } from "../../../structures/Rawon.js";
import { type SearchTrackResult, type Song, type SpotifyTrack } from "../../../typings/index.js";
import { getMaxResThumbnail } from "../../functions/getMaxResThumbnail.js";
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
    return url.searchParams.get("v");
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
                                thumbnail: track.artwork_url,
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
                                thumbnail: track.artwork_url,
                                title: track.title,
                                url: track.permalink_url,
                            }),
                        );

                        result.items = tracks;
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
                                        thumbnail: getMaxResThumbnail(
                                            track.thumbnails.sort(
                                                (a, b) => b.height * b.width - a.height * a.width,
                                            )[0].url,
                                        ),
                                        title: track.title,
                                        url: `https://youtube.com/watch?v=${track.id}`,
                                    },
                                ];
                            }
                        } catch {
                            try {
                                const videoUrl = `https://youtube.com/watch?v=${videoId}`;
                                const videoInfo = await getInfo(videoUrl);

                                if (videoInfo?.id) {
                                    result.items = [
                                        {
                                            duration: videoInfo.duration ?? 0,
                                            id: videoInfo.id,
                                            thumbnail: getMaxResThumbnail(
                                                videoInfo.thumbnails?.sort(
                                                    (a, b) =>
                                                        b.height * b.width - a.height * a.width,
                                                )[0]?.url ?? "",
                                            ),
                                            title: videoInfo.title ?? "Unknown",
                                            url: videoInfo.url ?? videoUrl,
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
                            const tracks = (
                                playlist instanceof Playlist
                                    ? playlist.videos.items
                                    : playlist.videos
                            ).map(
                                (track): Song => ({
                                    duration: track.duration ?? 0,
                                    id: track.id,
                                    thumbnail: getMaxResThumbnail(
                                        track.thumbnails.sort(
                                            (a, b) => b.height * b.width - a.height * a.width,
                                        )[0].url,
                                    ),
                                    title: track.title,
                                    url: `https://youtube.com/watch?v=${track.id}`,
                                }),
                            );

                            if ((songIndex?.length ?? 0) > 0) {
                                temp =
                                    Number.parseInt(songIndex ?? "", 10) < 101
                                        ? tracks.splice(
                                              Number.parseInt(songIndex ?? "", 10) - 1,
                                              1,
                                          )[0]
                                        : null;
                            }
                            if (temp) {
                                tracks.unshift(temp);
                            }

                            result.items = tracks;
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

                switch (queryData.type) {
                    case "track": {
                        const songData = (await client.spotify.resolveTracks(
                            url.toString(),
                        )) as unknown as SpotifyTrack;
                        let response = await youtube.search(
                            songData.external_ids?.isrc ??
                                `${songData.artists[0].name} - ${songData.name}`,
                            {
                                type: "video",
                            },
                        );
                        if (response.items.length === 0) {
                            response = await youtube.search(
                                `${songData.artists[0].name} - ${songData.name}`,
                                {
                                    type: "video",
                                },
                            );
                        }
                        const track = sortVideos(songData, response);
                        if (track.length > 0) {
                            result.items = [
                                {
                                    duration: track[0].duration ?? 0,
                                    id: track[0].id,
                                    thumbnail: getMaxResThumbnail(
                                        track[0].thumbnails.sort(
                                            (a, b) => b.height * b.width - a.height * a.width,
                                        )[0].url,
                                    ),
                                    title: track[0].title,
                                    url: `https://youtube.com/watch?v=${track[0].id}`,
                                },
                            ];
                        }
                        break;
                    }

                    case "playlist": {
                        const songs = (await client.spotify.resolveTracks(
                            url.toString(),
                        )) as unknown as {
                            track: SpotifyTrack;
                        }[];
                        await Promise.all(
                            songs.map(async (x): Promise<void> => {
                                let response = await youtube.search(
                                    x.track.external_ids?.isrc ??
                                        `${x.track.artists.map((y) => y.name).join(", ")}${x.track.name}`,
                                    { type: "video" },
                                );
                                if (response.items.length === 0) {
                                    response = await youtube.search(
                                        `${x.track.artists.map((y) => y.name).join(", ")}${x.track.name}`,
                                        { type: "video" },
                                    );
                                }
                                const track = sortVideos(x.track, response);
                                if (track.length > 0) {
                                    result.items.push({
                                        duration: track[0].duration ?? 0,
                                        id: track[0].id,
                                        thumbnail: getMaxResThumbnail(
                                            track[0].thumbnails.sort(
                                                (a, b) => b.height * b.width - a.height * a.width,
                                            )[0].url,
                                        ),
                                        title: track[0].title,
                                        url: `https://youtube.com/watch?v=${track[0].id}`,
                                    });
                                }
                            }),
                        );
                        break;
                    }

                    default:
                        break;
                }

                break;
            }

            default: {
                const info = await getInfo(url.toString()).catch(() => void 0);

                result.items = [
                    {
                        duration: info?.duration ?? 0,
                        id: info?.id ?? "",
                        thumbnail: getMaxResThumbnail(
                            info?.thumbnails?.sort(
                                (a, b) => b.height * b.width - a.height * a.width,
                            )[0].url ?? "",
                        ),
                        title: info?.title ?? "Unknown Song",
                        url: info?.url ?? url.toString(),
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
                    thumbnail: track.artwork_url,
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
                            thumbnail: getMaxResThumbnail(
                                track.thumbnails.sort(
                                    (a, b) => b.height * b.width - a.height * a.width,
                                )[0].url,
                            ),
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
                            thumbnail: getMaxResThumbnail(
                                track.thumbnails.sort(
                                    (a, b) => b.height * b.width - a.height * a.width,
                                )[0].url,
                            ),
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
                            thumbnail: getMaxResThumbnail(
                                track.thumbnails.sort(
                                    (a, b) => b.height * b.width - a.height * a.width,
                                )[0].url,
                            ),
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
