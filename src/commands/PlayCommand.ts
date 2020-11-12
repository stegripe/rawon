/* eslint-disable block-scoped-var, @typescript-eslint/restrict-template-expressions */
import { BaseCommand } from "../structures/BaseCommand";
import { ServerQueue } from "../structures/ServerQueue";
import { playSong } from "../utils/YoutubeDownload";
import { Util, MessageEmbed, VoiceChannel } from "discord.js";
import { decodeHTML } from "entities";
import { IMessage, ISong, IGuild } from "../../typings";
import { Video } from "../utils/YoutubeAPI/structures/Video";
import { DefineCommand } from "../utils/decorators/DefineCommand";
import { isUserInTheVoiceChannel, isSameVoiceChannel, isValidVoiceChannel } from "../utils/decorators/MusicHelper";
import { createEmbed } from "../utils/createEmbed";

@DefineCommand({
    aliases: ["p", "add", "play-music"],
    name: "play",
    description: "Play some music",
    usage: "{prefix}play <youtube video or youtube video name or playlist link>"
})
export class PlayCommand extends BaseCommand {
    @isUserInTheVoiceChannel()
    @isValidVoiceChannel()
    @isSameVoiceChannel()
    public async execute(message: IMessage, args: string[]): Promise<any> {
        const voiceChannel = message.member!.voice.channel!;
        if (!args[0]) {
            return message.channel.send(
                createEmbed("warn", `Invalid arguments, type **\`${this.client.config.prefix}help play\`** for more information`)
            );
        }
        const searchString = args.join(" ");
        const url = searchString.replace(/<(.+)>/g, "$1");

        if (message.guild?.queue !== null && voiceChannel.id !== message.guild?.queue.voiceChannel?.id) {
            return message.channel.send(
                createEmbed("warn", `Music on this server is already playing on: **\`${message.guild?.queue.voiceChannel?.name}\`** voice channel`)
            );
        }

        if (/^https?:\/\/(www.youtube.com|youtube.com)\/playlist(.*)$/.exec(url)) {
            try {
                const playlist = await this.client.youtube.getPlaylistByURL(url);
                const videos = await playlist.getVideos();
                let skippedVideos = 0;
                message.channel.send(createEmbed("info", `Adding all videos in playlist: **[${playlist.title}](${playlist.url})**, hang on...`))
                    .catch(e => this.client.logger.error("PLAY_CMD_ERR:", e));
                for (const video of Object.values(videos)) {
                    if (video.status.privacyStatus === "private") {
                        skippedVideos++;
                        continue;
                    } else {
                        const video2 = await this.client.youtube.getVideo(video.id);
                        await this.handleVideo(video2, message, voiceChannel, true);
                    }
                }
                if (skippedVideos !== 0) {
                    message.channel.send(
                        createEmbed("warn", `${skippedVideos} ${skippedVideos >= 2 ? `videos` : `video`} are skipped because it's a private video`)
                    ).catch(e => this.client.logger.error("PLAY_CMD_ERR:", e));
                }
                if (skippedVideos === playlist.itemCount) return message.channel.send(createEmbed("error", `Failed to load **[${playlist.title}](${playlist.url})** playlist because all of items are private video.`));
                return message.channel.send(createEmbed("info", `✅  **|**  All videos in **[${playlist.title}](${playlist.url})**, has been added to the queue!`));
            } catch (e) {
                if (e.response.body.error.message === 'The request cannot be completed because you have exceeded your <a href="/youtube/v3/getting-started#quota">quota</a>.') {
                    this.client.logger.error("YT_PLAYLIST_ERR:", new Error("YouTube Data API v3 quota exceeded"));
                    return message.channel.send(createEmbed("error", `Error: \`YouTube Data API v3 quota exceeded\`, please contact the bot owner.`));
                }
                this.client.logger.error("YT_PLAYLIST_ERR:", e);
                return message.channel.send(createEmbed("error", `I can't load the playlist.\nError: \`${e.message}\``));
            }
        }
        try {
            // eslint-disable-next-line no-var, block-scoped-var
            var video = await this.client.youtube.getVideoByURL(url);
        } catch (e) {
            try {
                const videos = await this.client.youtube.searchVideos(searchString, this.client.config.searchMaxResults);
                if (videos.length === 0) return message.channel.send(createEmbed("error", "I could not obtain any search results."));
                if (this.client.config.disableSongSelection) { video = await this.client.youtube.getVideo(videos[0].id); } else {
                    let index = 0;
                    const msg = await message.channel.send(new MessageEmbed()
                        .setAuthor("Song Selection")
                        .setDescription(`\`\`\`\n${videos.map(video => `${++index} - ${this.cleanTitle(video.title)}`).join("\n")}\`\`\`\n` +
                        `Please provide a value to select one of the search results ranging from **\`1-${this.client.config.searchMaxResults}\`**!`)
                        .setThumbnail(message.client.user?.displayAvatarURL() as string)
                        .setColor(this.client.config.embedColor)
                        .setFooter("• Type cancel or c to cancel the song selection"));
                    try {
                    // eslint-disable-next-line no-var
                        var response = await message.channel.awaitMessages((msg2: IMessage) => {
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
                        return message.channel.send(createEmbed("error", "No or invalid value entered, the song selection has been canceled."));
                    }
                    if (response.first()?.content === "c" || response.first()?.content === "cancel") {
                        return message.channel.send(createEmbed("warn", "The song selection has been canceled."));
                    }
                    const videoIndex = parseInt(response.first()?.content as string, 10);
                    video = await this.client.youtube.getVideo(videos[videoIndex - 1].id);
                }
            } catch (err) {
                if (e.response.body.error.message === 'The request cannot be completed because you have exceeded your <a href="/youtube/v3/getting-started#quota">quota</a>.') {
                    this.client.logger.error("YT_SEARCH_ERR:", new Error("YouTube Data API v3 quota exceeded"));
                    return message.channel.send(createEmbed("error", `Error: \`YouTube Data API v3 quota exceeded\`, please contact the bot owner.`));
                }
                this.client.logger.error("YT_SEARCH_ERR:", err);
                return message.channel.send(createEmbed("error", `I could not obtain any search results.\nError: \`${err.message}\``));
            }
        }
        return this.handleVideo(video, message, voiceChannel);
    }

    private async handleVideo(video: Video, message: IMessage, voiceChannel: VoiceChannel, playlist = false): Promise<any> {
        const song: ISong = {
            id: video.id,
            title: this.cleanTitle(video.title),
            url: video.url,
            thumbnail: video.thumbnailURL
        };
        if (message.guild?.queue) {
            if (!this.client.config.allowDuplicate && message.guild.queue.songs.find(s => s.id === song.id)) {
                return message.channel.send(
                    createEmbed("warn", `Song: **[${song.title}](${song.id})** is already queued, and this bot configuration disallow duplicated song in queue, ` +
                `please use \`${this.client.config.prefix}repeat\` instead`)
                        .setTitle("⌛ Already queued")
                );
            }
            message.guild.queue.songs.addSong(song);
            if (playlist) return;
            message.channel.send(createEmbed("info", `✅  **|**  **[${song.title}](${song.url})** has been added to the queue!`).setThumbnail(song.thumbnail))
                .catch(e => this.client.logger.error("PLAY_CMD_ERR:", e));
        } else {
            message.guild!.queue = new ServerQueue(message.channel, voiceChannel);
            message.guild?.queue.songs.addSong(song);
            try {
                const connection = await message.guild?.queue.voiceChannel?.join();
                message.guild!.queue.connection = connection!;
            } catch (error) {
                message.guild?.queue.songs.clear();
                message.guild!.queue = null;
                this.client.logger.error("PLAY_CMD_ERR:", error);
                message.channel.send(createEmbed("error", `Error: Could not join the voice channel, because:\n\`${error}\``))
                    .catch(e => this.client.logger.error("PLAY_CMD_ERR:", e));
                return undefined;
            }
            this.play(message.guild!).catch(err => {
                message.channel.send(createEmbed("error", `Error while trying to play music:\n\`${err}\``))
                    .catch(e => this.client.logger.error("PLAY_CMD_ERR:", e));
                return this.client.logger.error("PLAY_CMD_ERR:", err);
            });
        }
        return message;
    }

    private async play(guild: IGuild): Promise<any> {
        const serverQueue = guild.queue!;
        const song = serverQueue.songs.first();
        if (!song) {
            serverQueue.textChannel?.send(
                createEmbed("info", `⏹  **|**  Queue has finished, use **\`${guild.client.config.prefix}play\`** again to play more songs!`)
            ).catch(e => this.client.logger.error("PLAY_ERR:", e));
            serverQueue.connection?.disconnect();
            return guild.queue = null;
        }

        serverQueue.connection?.voice?.setSelfDeaf(true).catch(e => this.client.logger.error("PLAY_ERR:", e));
        const songData = await playSong(song.url, { cache: this.client.config.cacheYoutubeDownloads, cacheMaxLength: this.client.config.cacheMaxLengthAllowed });

        if (songData.cache) this.client.logger.info(`${this.client.shard ? `[Shard #${this.client.shard.ids}]` : ""} Using cache for song "${song.title}" on ${guild.name}`);

        serverQueue.connection?.play(songData.stream, { type: songData.canDemux ? "webm/opus" : "unknown", bitrate: "auto", highWaterMark: 1 })
            .on("start", () => {
                serverQueue.playing = true;
                this.client.logger.info(`${this.client.shard ? `[Shard #${this.client.shard.ids}]` : ""} Song: "${song.title}" on ${guild.name} has started`);
                serverQueue.textChannel?.send(createEmbed("info", `▶  **|**  Start playing: **[${song.title}](${song.url})**`).setThumbnail(song.thumbnail))
                    .catch(e => this.client.logger.error("PLAY_ERR:", e));
            })
            .on("finish", () => {
                this.client.logger.info(`${this.client.shard ? `[Shard #${this.client.shard.ids}]` : ""} Song: "${song.title}" on ${guild.name} has ended`);
                // eslint-disable-next-line max-statements-per-line
                if (serverQueue.loopMode === 0) { serverQueue.songs.deleteFirst(); } else if (serverQueue.loopMode === 2) { serverQueue.songs.deleteFirst(); serverQueue.songs.addSong(song); }
                /* serverQueue.textChannel?.send(createEmbed("info", `⏹  **|**  Stop playing: **[${song.title}](${song.url})**`).setThumbnail(song.thumbnail))
                    .catch(e => this.client.logger.error("PLAY_ERR:", e)); */
                this.play(guild).catch(e => {
                    serverQueue.textChannel?.send(createEmbed("error", `Error while trying to play music:\n\`${e}\``))
                        .catch(e => this.client.logger.error("PLAY_ERR:", e));
                    serverQueue.connection?.dispatcher.end();
                    return this.client.logger.error("PLAY_ERR:", e);
                });
            })
            .on("error", (err: Error) => {
                this.client.logger.error("PLAY_ERR:", err);
            })
            .setVolume(serverQueue.volume / guild.client.config.maxVolume);
    }

    private cleanTitle(title: string): string {
        return Util.escapeMarkdown(decodeHTML(title));
    }
}
