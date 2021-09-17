import { getTracks, getPreview, Preview, Tracks } from "./SpotifyUtil";
import { QueryData, ISong, SearchTrackResult } from "../../typings";
import { soundcloud } from "./SoundCloudUtil";
import { youtube } from "./YouTubeUtil";
import { getInfo } from "./YTDLUtil";
import { Video, SearchResult } from "youtubei";
import { URL } from "url";

export async function searchTrack(query: string, source: "soundcloud"|"youtube"|undefined = "soundcloud"): Promise<SearchTrackResult> {
    const result: SearchTrackResult = {
        items: []
    };

    const queryData = checkQuery(query);
    if (queryData.isURL) {
        const url = new URL(query);

        if (queryData.sourceType === "soundcloud") {
            if (queryData.type === "track") {
                const track = await soundcloud.tracks.getV2(url.toString());

                result.items = [{
                    duration: track.full_duration,
                    id: track.id.toString(),
                    thumbnail: track.artwork_url,
                    title: track.title,
                    url: track.permalink_url
                }];
            } else if (queryData.type === "playlist") {
                const playlist = await soundcloud.playlists.getV2(url.toString());
                const tracks = await Promise.all(playlist.tracks.map((track): ISong => ({
                    duration: track.full_duration,
                    id: track.id.toString(),
                    thumbnail: track.artwork_url,
                    title: track.title,
                    url: track.permalink_url
                })));

                result.items = tracks;
            }

            result.type = "results";
        } else if (queryData.sourceType === "youtube") {
            if (queryData.type === "track") {
                const track = await youtube.getVideo(url.toString());

                if (track) {
                    result.items = [{
                        duration: track.isLiveContent ? 0 : (track as Video).duration,
                        id: track.id,
                        thumbnail: track.thumbnails.sort((a, b) => (b.height * b.width) - (a.height * a.width))[0].url,
                        title: track.title,
                        url: `https://youtube.com/watch?v=${track.id}`
                    }];
                }
            } else if (queryData.type === "playlist") {
                const playlist = await youtube.getPlaylist(url.toString());

                if (playlist) {
                    const tracks = await Promise.all(playlist.videos.map((track): ISong => ({
                        duration: track.duration === null ? 0 : track.duration,
                        id: track.id,
                        thumbnail: track.thumbnails.sort((a, b) => (b.height * b.width) - (a.height * a.width))[0].url,
                        title: track.title,
                        url: `https://youtube.com/watch?v=${track.id}`
                    })));

                    result.items = tracks;
                }
            }

            result.type = "results";
        } else if (queryData.sourceType === "spotify") {
            function sortVideos(preview: Preview|Tracks, videos: SearchResult<"video">): SearchResult<"video"> {
                return videos.sort((a, b) => {
                    const isTrack = ("artists" in preview);

                    if ([a.title.toLowerCase(), b.title.toLowerCase()].includes((isTrack ? preview.name : (preview as Preview).title).toLowerCase())) {
                        if (isTrack) {
                            if (preview.artists?.some(x => a.channel?.name.toLowerCase().includes(x.name))) {
                                return -1;
                            } else if (preview.artists?.some(x => b.channel?.name.toLowerCase().includes(x.name))) {
                                return 1;
                            }
                        } else if (a.channel?.name.toLowerCase().includes((preview as Preview).artist.toLowerCase())) {
                            return -1;
                        } else if (b.channel?.name.toLowerCase().includes((preview as Preview).artist.toLowerCase())) {
                            return 1;
                        }
                    }

                    return 0;
                });
            }

            if (queryData.type === "track") {
                const songData = await getPreview(url.toString());
                const track = sortVideos(songData, await youtube.search(`${songData.artist} - ${songData.title}`, { type: "video" }))[0];

                result.items = [{
                    duration: track.duration === null ? 0 : track.duration,
                    id: track.id,
                    thumbnail: track.thumbnails.sort((a, b) => (b.height * b.width) - (a.height * a.width))[0].url,
                    title: track.title,
                    url: songData.link
                }];
            } else if (queryData.type === "playlist") {
                const songs = await getTracks(url.toString());
                const tracks = await Promise.all(songs.map(async (x): Promise<ISong> => {
                    const track = sortVideos(x, await youtube.search(`${x.artists ? `${x.artists.map(y => y.name).join(", ")} - ` : ""}${x.name}`))[0];

                    return {
                        duration: track.duration === null ? 0 : track.duration,
                        id: track.id,
                        thumbnail: track.thumbnails.sort((a, b) => (b.height * b.width) - (a.height * a.width))[0].url,
                        title: track.title,
                        url: x.external_urls.spotify
                    };
                }));

                result.items = tracks;
            }

            result.type = "results";
        } else {
            const info = await getInfo(url.toString()).catch(() => undefined);

            result.type = "results";
            result.items = [{
                duration: info?.duration ?? 0,
                id: info?.id ?? "",
                thumbnail: info?.thumbnails.sort((a, b) => (b.height * b.width) - (a.height * a.width))[0].url ?? "",
                title: info?.title ?? "Unknown Song",
                url: info?.url ?? url.toString()
            }];
        }
    } else {
        result.type = "selection";

        if (source === "soundcloud") {
            const searchRes = await soundcloud.tracks.searchV2({
                q: query
            });
            const tracks = await Promise.all(searchRes.collection.map((track): ISong => ({
                duration: track.full_duration,
                id: track.id.toString(),
                thumbnail: track.artwork_url,
                title: track.title,
                url: track.permalink_url
            })));

            result.items = tracks;
        } else {
            const searchRes = await youtube.search(query, { type: "video" });
            const tracks = await Promise.all(searchRes.map((track): ISong => ({
                duration: track.duration === null ? 0 : track.duration,
                id: track.id,
                thumbnail: track.thumbnails.sort((a, b) => (b.height * b.width) - (a.height * a.width))[0].url,
                title: track.title,
                url: `https://youtube.com/watch?v=${track.id}`
            })));

            result.items = tracks;
        }
    }

    return result;
}

export function checkQuery(string: string): QueryData {
    let url: URL;
    try {
        url = new URL(string);
    } catch (e) {
        return {
            isURL: false,
            sourceType: "query"
        };
    }

    const result: QueryData = {
        isURL: true
    };

    if (/soundcloud|snd/g.exec(url.hostname)) {
        result.sourceType = "soundcloud";

        if (url.pathname.includes("/sets/")) {
            result.type = "playlist";
        } else {
            result.type = "track";
        }
    } else if (/youtube|youtu\.be/g.exec(url.hostname)) {
        result.sourceType = "youtube";

        if (!/youtu\.be/g.exec(url.hostname) && url.pathname.startsWith("/playlist")) {
            result.type = "playlist";
        } else if ((/youtube/g.exec(url.hostname) && url.pathname.startsWith("/watch")) || (/youtu\.be/g.exec(url.hostname) && (url.pathname !== ""))) {
            result.type = "track";
        } else {
            result.type = "unknown";
        }
    } else if (/spotify/g.exec(url.hostname)) {
        result.sourceType = "spotify";

        if (url.pathname.startsWith("/playlist")) {
            result.type = "playlist";
        } else if (url.pathname.startsWith("/track")) {
            result.type = "track";
        } else {
            result.type = "unknown";
        }
    } else {
        result.sourceType = "unknown";
        result.type = "unknown";
    }

    return result;
}
