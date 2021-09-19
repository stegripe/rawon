import { Disc } from "../../structures/Disc";
import { QueryData, ISong, SearchTrackResult, IQueueSong } from "../../typings";
import { createEmbed } from "../createEmbed";
import { getTracks, getPreview, Preview, Tracks } from "./SpotifyUtil";
import { youtube } from "./YouTubeUtil";
import { getInfo, getStream } from "./YTDLUtil";
import { AudioPlayerError, AudioPlayerPlayingState, AudioPlayerStatus, createAudioPlayer, createAudioResource, demuxProbe, entersState, VoiceConnectionStatus } from "@discordjs/voice";
import { Guild } from "discord.js";
import { Video, SearchResult } from "youtubei";
import { URL } from "url";

export async function searchTrack(client: Disc, query: string, source: "soundcloud"|"youtube"|undefined = "soundcloud"): Promise<SearchTrackResult> {
    const result: SearchTrackResult = {
        items: []
    };

    const queryData = checkQuery(query);
    if (queryData.isURL) {
        const url = new URL(query);

        if (queryData.sourceType === "soundcloud") {
            if (queryData.type === "track") {
                const track = await client.soundcloud.tracks.getV2(url.toString());

                result.items = [{
                    duration: track.full_duration,
                    id: track.id.toString(),
                    thumbnail: track.artwork_url,
                    title: track.title,
                    url: track.permalink_url
                }];
            } else if (queryData.type === "playlist") {
                const playlist = await client.soundcloud.playlists.getV2(url.toString());
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
            const searchRes = await client.soundcloud.tracks.searchV2({
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

export async function play(client: Disc, guild: Guild, nextSong?: string): Promise<void> {
    const queue = guild.queue;
    if (!queue) return;

    const wasNull = queue.player === null;
    if (queue.player === null) queue.player = createAudioPlayer();

    const song = nextSong ? queue.songs.get(nextSong)! : queue.songs.first()!;
    const probe = await demuxProbe(await getStream(song.song.url));
    const resource = createAudioResource(probe.stream, { inlineVolume: true, inputType: probe.type, metadata: song });

    queue.connection?.subscribe(queue.player);

    entersState(queue.connection!, VoiceConnectionStatus.Ready, 15000)
        .then(() => queue.player?.play(resource))
        .catch((err: Error) => {
            if (err.message === "The operation was aborted") err.message = "I couldn't establish a voice connection within 15 seconds.";
            queue.player?.emit("error", new AudioPlayerError(err, resource));
        });

    const sendStartPlayingMsg = (newSong: IQueueSong["song"]): void => {
        client.logger.info(`${client.shard ? `[Shard #${client.shard.ids[0]}]` : ""} Track: "${newSong.title}" on ${guild.name} has started`);
        queue.textChannel.send({ embeds: [createEmbed("info", `▶ **|** Started playing **[${newSong.title}](${newSong.url})**`).setThumbnail(newSong.thumbnail)] })
            .then(m => queue.lastMusicMsg = m.id)
            .catch(e => client.logger.error("PLAY_ERR:", e));
    };

    if (!wasNull) {
        sendStartPlayingMsg(song.song);
        return;
    }

    queue.player.on("stateChange", (oldState, newState) => {
        if ((newState.status === AudioPlayerStatus.Playing) && (oldState.status !== AudioPlayerStatus.Paused)) {
            const newSong = ((queue.player!.state as AudioPlayerPlayingState).resource.metadata as IQueueSong).song;
            sendStartPlayingMsg(newSong);
        } else if (newState.status === AudioPlayerStatus.Idle) {
            client.logger.info(`${client.shard ? `[Shard #${client.shard.ids[0]}]` : ""} Track: "${song.song.title}" on ${guild.name} has ended`);
            if (queue.loopMode === "OFF") {
                queue.songs.delete(song.key);
            }

            const nextSong = (queue.shuffle && (queue.loopMode !== "SONG")) ? queue.songs.random() : (queue.loopMode === "SONG" ? queue.songs.get(song.key) : queue.songs.sortByIndex().filter(x => x.index > song.index).first() ?? queue.songs.sortByIndex().first());

            queue.textChannel.send({ embeds: [createEmbed("info", `⏹ **|** Stopped playing **[${song.song.title}](${song.song.url})**`).setThumbnail(song.song.thumbnail)] })
                .then(m => queue.lastMusicMsg = m.id)
                .catch(e => client.logger.error("PLAY_ERR:", e))
                .finally(() => {
                    queue.player = null;
                    play(client, guild, nextSong?.key).catch(e => {
                        queue.textChannel.send({ embeds: [createEmbed("error", `An error occurred while trying to play music, because: \`${e}\``, true)] })
                            .catch(e => client.logger.error("PLAY_ERR:", e));
                        queue.connection?.disconnect();
                        return client.logger.error("PLAY_ERR:", e);
                    });
                });
        }
    })
        .on("error", err => {
            queue.textChannel.send({ embeds: [createEmbed("error", `An error occurred while trying to play music, because: \`${err.message}\``)] }).catch(e => client.logger.error("PLAY_CMD_ERR:", e));
            queue.connection?.disconnect();
            delete guild.queue;
            client.logger.error("PLAY_ERR:", err);
        });
}
