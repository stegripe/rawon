import { isUserInTheVoiceChannel, isSameVoiceChannel, isValidVoiceChannel } from "../utils/decorators/MusicHelper";
import { resolveYTPlaylistID, resolveYTVideoID } from "../utils/YouTube/utils/YouTubeAPI/resolveYTURL";
import { DefineCommand } from "../utils/decorators/DefineCommand";
import { loopMode, ServerQueue } from "../structures/ServerQueue";
import { Video } from "../utils/YouTube/structures/Video";
import { BaseCommand } from "../structures/BaseCommand";
import { createEmbed } from "../utils/createEmbed";
import { ISong } from "../typings";
import { Util, VoiceChannel, Message, TextChannel, Guild, Collection, Snowflake } from "discord.js";
import { decodeHTML } from "entities";

@DefineCommand({
    aliases: ["p", "add", "play-music"],
    description: "Play some music",
    name: "play",
    usage: "{prefix}play <youtube video or playlist link | youtube video name>"
})
export class PlayCommand extends BaseCommand {
    private readonly playlistAlreadyQueued: Collection<Snowflake, ISong[]> = new Collection();

    @isUserInTheVoiceChannel()
    @isValidVoiceChannel()
    @isSameVoiceChannel()
    public async execute(message: Message, args: string[]): Promise<any> {
        const voiceChannel = message.member!.voice.channel!;
        if (!args[0]) {
            return message.channel.send(
                createEmbed("warn", `Invalid usage, please use **\`${this.client.config.prefix}help ${this.meta.name}\`** for more information`)
            );
        }
        const searchString = args.join(" ");
        const url = searchString.replace(/<(.+)>/g, "$1");

        if (message.guild?.queue !== null && voiceChannel.id !== message.guild?.queue.voiceChannel?.id) {
            return message.channel.send(
                createEmbed("warn", `The music player is already playing to **${message.guild!.queue.voiceChannel!.name}** voice channel`)
            );
        }

        let video: Video | null = null;
        let response: Collection<Snowflake, Message> | null = null;

        if (/^https?:\/\/((www|music)\.youtube\.com|youtube.com)\/playlist(.*)$/.exec(url)) {
            try {
                const id = resolveYTPlaylistID(url);
                if (!id) return message.channel.send(createEmbed("error", "Invalid YouTube Playlist URL."));
                const playlist = await this.client.youtube.getPlaylist(id);
                const videos = await playlist.getVideos();
                let skippedVideos = 0;
                const addingPlaylistVideoMessage = await message.channel.send(
                    createEmbed("info", `Adding all tracks in playlist: **[${playlist.title}](${playlist.url})**, please wait...`)
                        .setThumbnail(playlist.thumbnailURL)
                );
                for (const video of Object.values(videos)) {
                    if (video.isPrivate) {
                        skippedVideos++;
                        continue;
                    } else {
                        await this.handleVideo(video, message, voiceChannel, true);
                    }
                }
                if (skippedVideos !== 0) {
                    message.channel.send(
                        createEmbed("warn", `${skippedVideos} track${skippedVideos >= 2 ? "s" : ""} are skipped because it was a private video.`)
                    ).catch(e => this.client.logger.error("PLAY_CMD_ERR:", e));
                }
                const playlistAlreadyQueued = this.playlistAlreadyQueued.get(message.guild.id);
                if (!this.client.config.allowDuplicate && Number(playlistAlreadyQueued?.length) > 0) {
                    let num = 1;
                    const songs = playlistAlreadyQueued!.map(s => `**${num++}.** **[${s.title}](${s.url})**`);
                    message.channel.send(
                        createEmbed("warn", `Over ${playlistAlreadyQueued!.length} track${playlistAlreadyQueued!.length >= 2 ? "s" : ""} are skipped because it was a duplicate` +
                        ` and this bot configuration disallow duplicated tracks in queue, please use **\`${this.client.config.prefix}repeat\`** instead.`)
                            .setTitle("Already Queued")
                    ).catch(e => this.client.logger.error("PLAY_CMD_ERR:", e));
                    const pages = this.client.util.paginate(songs.join("\n"));
                    let howManyMessage = 0;
                    for (const page of pages) {
                        howManyMessage++;
                        const embed = createEmbed(`warn`, page);
                        if (howManyMessage === 1) embed.setTitle("Duplicated tracks");
                        await message.channel.send(embed);
                    }
                    this.playlistAlreadyQueued.delete(message.guild.id);
                }
                message.channel.messages.fetch(addingPlaylistVideoMessage.id, false).then(m => m.delete()).catch(e => this.client.logger.error("YT_PLAYLIST_ERR:", e));
                if (skippedVideos === playlist.itemCount) {
                    return message.channel.send(
                        createEmbed("error", `Failed to load playlist **[${playlist.title}](${playlist.url})** because all of the items are private videos.`)
                            .setThumbnail(playlist.thumbnailURL)
                    );
                }
                return message.channel.send(
                    createEmbed("info", `All tracks in playlist: **[${playlist.title}](${playlist.url})**, has been added to the queue.`)
                        .setThumbnail(playlist.thumbnailURL)
                );
            } catch (e) {
                this.client.logger.error("YT_PLAYLIST_ERR:", new Error((e as Error).stack));
                return message.channel.send(createEmbed("error", `I could not load the playlist.\nError: \`${(e as Error).message}\``));
            }
        }
        try {
            const id = resolveYTVideoID(url);
            if (!id) return message.channel.send(createEmbed("error", "Invalid YouTube Video URL."));
            video = await this.client.youtube.getVideo(id);
        } catch (e) {
            try {
                const videos = await this.client.youtube.searchVideos(searchString, this.client.config.searchMaxResults);
                if (videos.length === 0) return message.channel.send(createEmbed("warn", "I could not obtain any search results."));

                if (videos.length === 1 || this.client.config.disableSongSelection) {
                    video = await this.client.youtube.getVideo(videos[0].id);
                } else {
                    let index = 0;
                    const msg = await message.channel.send(
                        createEmbed("info")
                            .setAuthor("Tracks Selection", message.client.user?.displayAvatarURL() as string)
                            .setDescription(
                                `Please select one of the results ranging from 1-${this.client.config.searchMaxResults}\n` +
                                `\`\`\`\n${videos.map(video => `${++index} - ${this.cleanTitle(video.title)}`).join("\n")}\`\`\``
                            )
                            .setFooter("Type cancel or c to cancel tracks selection.")
                    );
                    try {
                        response = await message.channel.awaitMessages((msg2: Message) => {
                            if (message.author.id !== msg2.author.id) return false;

                            if (msg2.content === "cancel" || msg2.content === "c") return true;
                            return Number(msg2.content) > 0 && Number(msg2.content) < 13;
                        }, {
                            max: 1,
                            time: this.client.config.selectTimeout,
                            errors: ["time"]
                        });
                        msg.delete().catch(e => this.client.logger.error("PLAY_CMD_ERR:", e));
                        response.first()?.delete({ timeout: 3000 }).catch(e => e); // do nothing
                    } catch (error) {
                        msg.delete().catch(e => this.client.logger.error("PLAY_CMD_ERR:", e));
                        return message.channel.send(createEmbed("error", "No or invalid value entered, tracks selection canceled."));
                    }
                    if (response.first()?.content === "c" || response.first()?.content === "cancel") {
                        return message.channel.send(createEmbed("info", "Tracks selection canceled."));
                    }
                    const videoIndex = parseInt(response.first()?.content as string);
                    video = await this.client.youtube.getVideo(videos[videoIndex - 1].id);
                }
            } catch (err) {
                this.client.logger.error("YT_SEARCH_ERR:", err);
                return message.channel.send(createEmbed("error", `I could not obtain any search results.\nError: \`${(err as Error).message}\``));
            }
        }
        return this.handleVideo(video, message, voiceChannel);
    }

    private async handleVideo(video: Video, message: Message, voiceChannel: VoiceChannel, playlist = false): Promise<any> {
        const song: ISong = {
            id: video.id,
            title: this.cleanTitle(video.title),
            url: video.url,
            thumbnail: video.thumbnailURL
        };
        if (message.guild?.queue) {
            if (!this.client.config.allowDuplicate && message.guild.queue.songs.find(s => s.id === song.id)) {
                if (playlist) {
                    const playlistAlreadyQueued = this.playlistAlreadyQueued.get(message.guild.id) ?? [];
                    playlistAlreadyQueued.push(song);
                    this.playlistAlreadyQueued.set(message.guild.id, playlistAlreadyQueued);
                    return undefined;
                }
                return message.channel.send(
                    createEmbed("warn", `Track **[${song.title}](${song.url})** is already queued, and this bot configuration disallow duplicated tracks in queue, ` +
                `please use **\`${this.client.config.prefix}repeat\`** instead.`)
                        .setThumbnail(song.thumbnail)
                        .setTitle("Already Queued")
                );
            }
            message.guild.queue.songs.addSong(song);
            if (!playlist) {
                message.channel.send(createEmbed("info", `✅ **|** Track **[${song.title}](${song.url})** has been added to the queue.`).setThumbnail(song.thumbnail))
                    .catch(e => this.client.logger.error("PLAY_CMD_ERR:", e));
            }
        } else {
            message.guild!.queue = new ServerQueue(message.channel as TextChannel, voiceChannel);
            message.guild?.queue.songs.addSong(song);
            if (!playlist) {
                message.channel.send(createEmbed("info", `✅ **|** Track **[${song.title}](${song.url})** has been added to the queue.`).setThumbnail(song.thumbnail))
                    .catch(e => this.client.logger.error("PLAY_CMD_ERR:", e));
            }
            try {
                const connection = await message.guild!.queue.voiceChannel!.join();
                message.guild!.queue.connection = connection;
            } catch (error) {
                message.guild?.queue.songs.clear();
                message.guild!.queue = null;
                this.client.logger.error("PLAY_CMD_ERR:", error);
                message.channel.send(createEmbed("error", `Error: Could not join the voice channel.\nReason: \`${(error as Error).message}\``))
                    .catch(e => this.client.logger.error("PLAY_CMD_ERR:", e));
                return undefined;
            }
            this.play(message.guild!).catch(err => {
                message.channel.send(createEmbed("error", `Error while trying to play music\nReason: \`${err.message}\``))
                    .catch(e => this.client.logger.error("PLAY_CMD_ERR:", e));
                return this.client.logger.error("PLAY_CMD_ERR:", err);
            });
        }
        return message;
    }

    private async play(guild: Guild): Promise<any> {
        const serverQueue = guild.queue!;
        const song = serverQueue.songs.first();
        if (!song) {
            serverQueue.oldMusicMessage = null; serverQueue.oldVoiceStateUpdateMessage = null;
            serverQueue.textChannel?.send(
                createEmbed("info", `⏹ **|** Queue is empty, please use **\`${guild.client.config.prefix}play\`** again to play more music.`)
            ).catch(e => this.client.logger.error("PLAY_ERR:", e));
            serverQueue.connection?.disconnect();
            return guild.queue = null;
        }

        serverQueue.connection?.voice?.setSelfDeaf(true).catch(e => this.client.logger.error("PLAY_ERR:", e));
        const songData = await this.client.youtube.downloadVideo(song.url, {
            cache: this.client.config.cacheYoutubeDownloads,
            cacheMaxLength: this.client.config.cacheMaxLengthAllowed,
            skipFFmpeg: true
        });

        if (songData.cache) this.client.logger.info(`${this.client.shard ? `[Shard #${this.client.shard.ids[0]}]` : ""} Using cache for music "${song.title}" on ${guild.name}`);

        songData.on("error", err => { err.message = `YTDLError: ${err.message}`; serverQueue.connection?.dispatcher.emit("error", err); });
        serverQueue.connection?.play(songData, { type: songData.info.canSkipFFmpeg ? "webm/opus" : "unknown", bitrate: "auto", highWaterMark: 1 })
            .on("start", () => {
                serverQueue.playing = true;
                this.client.logger.info(`${this.client.shard ? `[Shard #${this.client.shard.ids[0]}]` : ""} Track: "${song.title}" on ${guild.name} started`);
                serverQueue.textChannel?.send(createEmbed("info", `▶ **|** Start playing: **[${song.title}](${song.url})**`).setThumbnail(song.thumbnail))
                    .then(m => serverQueue.oldMusicMessage = m.id)
                    .catch(e => this.client.logger.error("PLAY_ERR:", e));
            })
            .on("finish", () => {
                this.client.logger.info(`${this.client.shard ? `[Shard #${this.client.shard.ids[0]}]` : ""} Track: "${song.title}" on ${guild.name} ended`);
                if (serverQueue.loopMode === loopMode.off) {
                    serverQueue.songs.deleteFirst();
                } else if (serverQueue.loopMode === loopMode.all) {
                    serverQueue.songs.deleteFirst(); serverQueue.songs.addSong(song);
                }
                serverQueue.textChannel?.send(createEmbed("info", `⏹ **|** Stop playing **[${song.title}](${song.url})**`).setThumbnail(song.thumbnail))
                    .then(m => serverQueue.oldMusicMessage = m.id)
                    .catch(e => this.client.logger.error("PLAY_ERR:", e))
                    .finally(() => {
                        this.play(guild).catch(e => {
                            serverQueue.textChannel?.send(createEmbed("error", `Error while trying to play music\nReason: \`${e}\``))
                                .catch(e => this.client.logger.error("PLAY_ERR:", e));
                            serverQueue.connection?.dispatcher.end();
                            return this.client.logger.error("PLAY_ERR:", e);
                        });
                    });
            })
            .on("error", (err: Error) => {
                serverQueue.textChannel?.send(createEmbed("error", `Error while playing music\nReason: \`${err.message}\``))
                    .catch(e => this.client.logger.error("PLAY_CMD_ERR:", e));
                guild.queue?.voiceChannel?.leave();
                guild.queue = null;
                this.client.logger.error("PLAY_ERR:", err);
            })
            .setVolume(serverQueue.volume / guild.client.config.maxVolume);
    }

    private cleanTitle(title: string): string {
        return Util.escapeMarkdown(decodeHTML(title));
    }
}
