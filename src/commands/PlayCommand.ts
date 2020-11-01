/* eslint-disable block-scoped-var, @typescript-eslint/restrict-template-expressions */
import BaseCommand from "../structures/BaseCommand";
import ServerQueue from "../structures/ServerQueue";
import ytdl from "../utils/YoutubeDownload";
import { Util, MessageEmbed } from "discord.js";
import { decodeHTML } from "entities";
import type { VoiceChannel } from "discord.js";
import type Disc_11 from "../structures/Disc_11";
import type { IMessage, ISong, IGuild } from "../../typings";
import type { Video } from "../utils/YoutubeAPI/structures/Video";

export default class PlayCommand extends BaseCommand {
    public constructor(public client: Disc_11, public readonly path: string) {
        super(client, path, { aliases: ["p", "add", "play-music"] }, {
            name: "play",
            description: "Play some music",
            usage: "{prefix}play <youtube video or playlist link / youtube video name>"
        });
    }

    public async execute(message: IMessage, args: string[]): Promise<any> {
        const voiceChannel = message.member?.voice.channel;
        if (!voiceChannel) return message.channel.send(new MessageEmbed().setDescription("I'm sorry, but you need to be in a voice channel to play music").setColor("YELLOW"));
        if (!voiceChannel.joinable) {
            return message.channel.send(
                new MessageEmbed().setDescription("I'm sorry, but I can't connect to your voice channel, make sure I have the proper permissions!").setColor("RED")
            );
        }
        if (!voiceChannel.speakable) {
            voiceChannel.leave();
            return message.channel.send(new MessageEmbed().setDescription("I'm sorry, but I can't speak in this voice channel, make sure I have the proper permissions"!)
                .setColor("RED"));
        }
        if (!args[0]) {
            return message.channel.send(
                new MessageEmbed().setDescription(`Invalid arguments, type **\`${this.client.config.prefix}help play\`** for more information`).setColor("YELLOW")
            );
        }
        const searchString = args.join(" ");
        const url = searchString.replace(/<(.+)>/g, "$1");

        if (message.guild?.queue !== null && voiceChannel.id !== message.guild?.queue.voiceChannel?.id) {
            return message.channel.send(new MessageEmbed()
                .setDescription(`Music on this server is already playing on: **\`${message.guild?.queue.voiceChannel?.name}\`** voice channel`)
                .setColor("YELLOW"));
        }

        if (/^https?:\/\/(www.youtube.com|youtube.com)\/playlist(.*)$/.exec(url)) {
            try {
                const playlist = await this.client.youtube.getPlaylistByURL(url);
                const videos = await playlist.getVideos();
                let skippedVideos = 0;
                message.channel.send(new MessageEmbed().setDescription(`Adding all videos in playlist: **[${playlist.title}](${playlist.url})**, Hang on...`).setColor("#00FF00"))
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
                        new MessageEmbed()
                            .setDescription(`${skippedVideos} ${skippedVideos >= 2 ? `videos` : `video`} are skipped because it's a private video`)
                            .setColor("YELLOW")
                    ).catch(e => this.client.logger.error("PLAY_CMD_ERR:", e));
                }
                if (skippedVideos === playlist.itemCount) return message.channel.send(new MessageEmbed().setDescription(`Failed to load **[${playlist.title}](${playlist.url})** playlist because all of the items are private videos`).setColor("RED"));
                return message.channel.send(new MessageEmbed().setDescription(`All videos in **[${playlist.title}](${playlist.url})**, has been added to the queue!`).setColor(this.client.config.embedColor));
            } catch (e) {
                this.client.logger.error("YT_SEARCH_ERR:", e);
                return message.channel.send(new MessageEmbed().setDescription(`I can't load the playlist.\nError: \`${e.message}\``).setColor("#FFFF00"));
            }
        }
        try {
            // eslint-disable-next-line no-var, block-scoped-var
            var video = await this.client.youtube.getVideoByURL(url);
        } catch (e) {
            try {
                const videos = await this.client.youtube.searchVideos(searchString, 10);
                if (videos.length === 0) return message.channel.send(new MessageEmbed().setDescription("I could not obtain any search results.").setColor("RED"));
                let index = 0;
                const msg = await message.channel.send(new MessageEmbed()
                    .setAuthor("Song Selection")
                    .setDescription(`\`\`\`\n${videos.map(video => `${++index} - ${this.cleanTitle(video.title)}`).join("\n")}\`\`\`\n` +
                        "Please provide a value to select one of the search results ranging from **\`1-10\`**!")
                    .setColor(this.client.config.embedColor)
                    .setFooter("• Type cancel or c to cancel the song selection"));
                try {
                    // eslint-disable-next-line no-var
                    var response = await message.channel.awaitMessages((msg2: IMessage) => {
                        if (message.author.id !== msg2.author.id) return false;

                        if (msg2.content === "cancel" || msg2.content === "c") return true;
                        return Number(msg2.content) > 0 && Number(msg2.content) < 11;
                    }, {
                        max: 1,
                        time: 20000,
                        errors: ["time"]
                    });
                    msg.delete().catch(e => this.client.logger.error("PLAY_CMD_ERR:", e));
                    response.first()?.delete({ timeout: 3000 }).catch(e => e); // do nothing
                } catch (error) {
                    msg.delete().catch(e => this.client.logger.error("PLAY_CMD_ERR:", e));
                    return message.channel.send(new MessageEmbed().setDescription("No or invalid value entered, song selection has canceled.").setColor("RED"));
                }
                if (response.first()?.content === "c" || response.first()?.content === "cancel") {
                    return message.channel.send(new MessageEmbed().setDescription("Song selection has canceled.").setColor("RED"));
                }
                const videoIndex = parseInt(response.first()?.content as string, 10);
                // eslint-disable-next-line no-var
                video = await this.client.youtube.getVideo(videos[videoIndex - 1].id);
            } catch (err) {
                this.client.logger.error("YT_SEARCH_ERR:", err);
                return message.channel.send(new MessageEmbed().setDescription(`I could not obtain any search results.\nError: \`${err.message}\``).setColor("RED"));
            }
        }
        return this.handleVideo(video, message, voiceChannel);
    }

    private async handleVideo(video: Video, message: IMessage, voiceChannel: VoiceChannel, playlist = false): Promise<any> {
        const song: ISong = {
            id: video.id,
            title: this.cleanTitle(video.title),
            url: video.url
        };
        if (message.guild?.queue) {
            if (!this.client.config.allowDuplicate && message.guild.queue.songs.find(s => s.id === song.id)) {
                return message.channel.send(new MessageEmbed()
                    .setTitle("⌛ Already queued")
                    .setColor("YELLOW")
                    .setDescription(`**[${song.title}](${song.id})** is already queued, and this bot configuration disallow duplicated song in queue, ` +
                `please use **\`${this.client.config.prefix}repeat\`** instead`));
            }
            message.guild.queue.songs.addSong(song);
            if (playlist) return;
            message.channel.send(new MessageEmbed().setDescription(`✅  **|**  **[${song.title}](${song.url})** has been added to the queue!`).setColor(this.client.config.embedColor))
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
                message.channel.send(new MessageEmbed().setDescription(`Error: Could not join the voice channel, because:\n\`${error}\``).setColor("RED"))
                    .catch(e => this.client.logger.error("PLAY_CMD_ERR:", e));
                return undefined;
            }
            this.play(message.guild!).catch(err => {
                message.channel.send(new MessageEmbed().setDescription(`Error while trying to play music:\n\`${err}\``).setColor("RED"))
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
                new MessageEmbed().setDescription(`⏹  **|**  Queue has finished, use **\`${guild.client.config.prefix}play\`** again to play more songs!`).setColor(this.client.config.embedColor)
            ).catch(e => this.client.logger.error("PLAY_ERR:", e));
            serverQueue.connection?.disconnect();
            return guild.queue = null;
        }

        serverQueue.connection?.voice?.setSelfDeaf(true).catch(e => this.client.logger.error("PLAY_ERR:", e));
        const songData = await ytdl(song.url, { cache: this.client.config.cacheYoutubeDownloads, cacheMaxLength: this.client.config.cacheMaxLengthAllowed });

        if (songData.cache) this.client.logger.info(`${this.client.shard ? `[Shard #${this.client.shard.ids}]` : ""} Using cache for song "${song.title}" on ${guild.name}`);

        serverQueue.connection?.play(songData.stream, { type: songData.canDemux ? "webm/opus" : "unknown", bitrate: "auto", highWaterMark: 1 })
            .on("start", () => {
                serverQueue.playing = true;
                this.client.logger.info(`${this.client.shard ? `[Shard #${this.client.shard.ids}]` : ""} Song: "${song.title}" on ${guild.name} has started`);
                serverQueue.textChannel?.send(new MessageEmbed().setDescription(`▶  **|**  Start playing: **[${song.title}](${song.url})**`).setColor(this.client.config.embedColor))
                    .catch(e => this.client.logger.error("PLAY_ERR:", e));
            })
            .on("finish", () => {
                this.client.logger.info(`${this.client.shard ? `[Shard #${this.client.shard.ids}]` : ""} Song: "${song.title}" on ${guild.name} has ended`);
                // eslint-disable-next-line max-statements-per-line
                if (serverQueue.loopMode === 0) { serverQueue.songs.deleteFirst(); } else if (serverQueue.loopMode === 2) { serverQueue.songs.deleteFirst(); serverQueue.songs.addSong(song); }
                /* serverQueue.textChannel?.send(new MessageEmbed().setDescription(`⏹  **|**  Stop playing: **[${song.title}](${song.url})**`).setColor(this.client.config.embedColor))
                    .catch(e => this.client.logger.error("PLAY_ERR:", e)); */
                this.play(guild).catch(e => {
                    serverQueue.textChannel?.send(new MessageEmbed().setDescription(`Error while trying to play music:\n\`${e}\``).setColor("RED"))
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
