import { Song, SearchTrackResult, SpotifyTrack } from "../../../typings/index.js";
import { Rawon } from "../../../structures/Rawon.js";
import { checkQuery } from "./checkQuery.js";
import { youtube } from "../YouTubeUtil.js";
import { getInfo } from "../YTDLUtil.js";
import { Playlist, SearchResult, Video, VideoCompact } from "youtubei";
import { URL } from "node:url";

export async function searchTrack(
    client: Rawon,
    query: string,
    source: "soundcloud" | "youtube" | undefined = "youtube"
): Promise<SearchTrackResult> {
    const result: SearchTrackResult = {
        items: []
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
                        const track = await client.soundcloud.tracks.getV2(scUrl.toString());

                        result.items = [
                            {
                                duration: track.full_duration,
                                id: track.id.toString(),
                                thumbnail: track.artwork_url,
                                title: track.title,
                                url: track.permalink_url
                            }
                        ];
                        break;
                    }

                    case "playlist": {
                        const playlist = await client.soundcloud.playlists.getV2(scUrl.toString());
                        const tracks = await Promise.all(
                            playlist.tracks.map(
                                (track): Song => ({
                                    duration: track.full_duration,
                                    id: track.id.toString(),
                                    thumbnail: track.artwork_url,
                                    title: track.title,
                                    url: track.permalink_url
                                })
                            )
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
                        const track = await youtube.getVideo(
                            /youtu\.be/g.exec(url.hostname) ? url.pathname.replace("/", "") : url.searchParams.get("v") ?? ''
                        );

                        if (track) {
                            result.items = [
                                {
                                    duration: track.isLiveContent ? 0 : (track as Video).duration,
                                    id: track.id,
                                    thumbnail: track.thumbnails.sort(
                                        (a, b) => b.height * b.width - a.height * a.width
                                    )[0].url,
                                    title: track.title,
                                    url: `https://youtube.com/watch?v=${track.id}`
                                }
                            ];
                        }
                        break;
                    }

                    case "playlist": {
                        const list = url.searchParams.get("list") ?? "";
                        const playlist = await youtube.getPlaylist(list);
                        const songIndex = url.searchParams.get("index");
                        let temp = null;

                        if (playlist) {
                            const tracks = await Promise.all(
                                (playlist instanceof Playlist ? playlist.videos.items : playlist.videos).map(
                                    (track): Song => ({
                                        duration: track.duration ?? 0,
                                        id: track.id,
                                        thumbnail: track.thumbnails.sort(
                                            (a, b) => b.height * b.width - a.height * a.width
                                        )[0].url,
                                        title: track.title,
                                        url: `https://youtube.com/watch?v=${track.id}`
                                    })
                                )
                            );

                            if (songIndex) temp = parseInt(songIndex) < 101 ? tracks.splice(parseInt(songIndex) - 1, 1)[0] : null;
                            if (temp) tracks.unshift(temp);

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
                // eslint-disable-next-line no-inner-declarations
                function sortVideos(track: SpotifyTrack, videos: SearchResult<"video">): VideoCompact[] {
                    return videos.items.sort((a, b) => {
                        let aValue = 0;
                        let bValue = 0;
                        const aDurationDiff = a.duration ? a.duration - track.duration_ms : null;
                        const bDurationDiff = b.duration ? b.duration - track.duration_ms : null;
                        
                        if (a.title.toLowerCase().includes(track.name.toLowerCase())) aValue--;
                        if (track.artists.some(x => a.channel?.name.toLowerCase().includes(x.name))) aValue--;
                        if (a.channel?.name.endsWith("- Topic")) aValue -= 2;
                        if (aDurationDiff ? aDurationDiff <= 5000 && aDurationDiff >= -5000 : false) aValue -= 2;

                        if (b.title.toLowerCase().includes(track.name.toLowerCase())) bValue++;
                        if (track.artists.some(x => b.channel?.name.toLowerCase().includes(x.name))) bValue++;
                        if (b.channel?.name.endsWith(" - Topic")) bValue += 2;
                        if (bDurationDiff ? bDurationDiff <= 5000 && bDurationDiff >= -5000 : false) bValue += 2;

                        return aValue + bValue;
                    });
                }

                switch (queryData.type) {
                    case "track": {
                        const songData = (await client.spotify.resolveTracks(
                            url.toString()
                        )) as unknown as SpotifyTrack;
                        let response = await youtube.search(
                            songData.external_ids?.isrc ?? `${songData.artists[0].name} - ${songData.name}`,
                            {
                                type: "video"
                            }
                        );
                        if (!response.items.length) {
                            response = await youtube.search(`${songData.artists[0].name} - ${songData.name}`, {
                                type: "video"
                            });
                        }
                        const track = sortVideos(songData, response);
                        if (track.length) {
                            result.items = [
                                {
                                    duration: track[0].duration ?? 0,
                                    id: track[0].id,
                                    thumbnail: track[0].thumbnails.sort(
                                        (a, b) => b.height * b.width - a.height * a.width
                                    )[0].url,
                                    title: track[0].title,
                                    url: `https://youtube.com/watch?v=${track[0].id}`
                                }
                            ];
                        }
                        break;
                    }

                    case "playlist": {
                        const songs = (await client.spotify.resolveTracks(url.toString())) as unknown as {
                            track: SpotifyTrack;
                        }[];
                        await Promise.all(
                            songs.map(async (x): Promise<void> => {
                                let response = await youtube.search(
                                    x.track.external_ids?.isrc ??
                                    `${x.track.artists.map(y => y.name).join(", ")}${x.track.name}`,
                                    { type: "video" }
                                );
                                if (!response.items.length) {
                                    response = await youtube.search(
                                        `${x.track.artists.map(y => y.name).join(", ")}${x.track.name}`,
                                        { type: "video" }
                                    );
                                }
                                const track = sortVideos(x.track, response);
                                if (track.length) {
                                    result.items.push({
                                        duration: track[0].duration ?? 0,
                                        id: track[0].id,
                                        thumbnail: track[0].thumbnails.sort(
                                            (a, b) => b.height * b.width - a.height * a.width
                                        )[0].url,
                                        title: track[0].title,
                                        url: `https://youtube.com/watch?v=${track[0].id}`
                                    });
                                }
                            })
                        );
                        break;
                    }

                    default:
                        break;
                }

                break;
            }

            default: {
                const info = await getInfo(url.toString()).catch(() => undefined);

                result.items = [
                    {
                        duration: info?.duration ?? 0,
                        id: info?.id ?? "",
                        thumbnail:
                            info?.thumbnails?.sort((a, b) => b.height * b.width - a.height * a.width)[0].url ?? "",
                        title: info?.title ?? "Unknown Song",
                        url: info?.url ?? url.toString()
                    }
                ];
                break;
            }
        }
    } else {
        result.type = "selection";

        if (source === "soundcloud") {
            const searchRes = await client.soundcloud.tracks.searchV2({
                q: query
            });
            const tracks = await Promise.all(
                searchRes.collection.map(
                    (track): Song => ({
                        duration: track.full_duration,
                        id: track.id.toString(),
                        thumbnail: track.artwork_url,
                        title: track.title,
                        url: track.permalink_url
                    })
                )
            );

            result.items = tracks;
        } else {
            const searchRes = (await youtube.search(query, { type: "video" }));
            const tracks = await Promise.all(
                searchRes.items.map(
                    (track): Song => ({
                        duration: track.duration ?? 0,
                        id: track.id,
                        thumbnail: track.thumbnails.sort((a, b) => b.height * b.width - a.height * a.width)[0].url,
                        title: track.title,
                        url: `https://youtube.com/watch?v=${track.id}`
                    })
                )
            );

            result.items = tracks;
        }
    }

    return result;
}
