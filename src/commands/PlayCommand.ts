/* eslint-disable no-var, block-scoped-var, @typescript-eslint/restrict-template-expressions */
import { isSameVoiceChannel, isUserInTheVoiceChannel, isValidVoiceChannel } from "../utils/decorators/MusicHelper";
import { DefineCommand } from "../utils/decorators/DefineCommand";
import { loopMode, ServerQueue } from "../structures/ServerQueue";
import { Video } from "../utils/youtube/structures/Video";
import { BaseCommand } from "../structures/BaseCommand";
import { createEmbed } from "../utils/createEmbed";
import { YouTube } from "../utils/youtube";
import { ISong } from "../typings";
import { AudioPlayerError, AudioPlayerStatus, createAudioPlayer, createAudioResource, entersState, joinVoiceChannel, VoiceConnectionStatus } from "@discordjs/voice";
import { Collection, Guild, Message, TextChannel, Snowflake, StageChannel, Util, VoiceChannel } from "discord.js";
import { decodeHTML } from "entities";
let disconnectTimer: any;

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
            return message.channel.send({
                embeds: [createEmbed("error", `Invalid usage, use **\`${this.client.config.prefix}help play\`** for more information`)]
            });
        }
        const searchString = args.join(" ");
        const url = searchString.replace(/<(.+)>/g, "$1");

        if (message.guild?.queue !== null && voiceChannel.id !== message.guild?.queue.voiceChannel?.id) {
            return message.channel.send({
                embeds: [createEmbed("warn", `The music player is already playing to **${message.guild!.queue.voiceChannel!.name}** voice channel`)]
            });
        }

        let video: Video | null = null;
        let response: Collection<Snowflake, Message> | null = null;

        if (/^https?:\/\/((www|music)\.youtube\.com|youtube.com)\/playlist(.*)$/.exec(url)) {
            try {
                const playlist = await YouTube.getPlaylist(url);
                const videos = await playlist.getVideos();
                const addingPlaylistVideoMessage = await message.channel.send({
                    embeds: [
                        createEmbed("info", `Adding all tracks in **[${playlist.title}](${playlist.url})** playlist, please wait...`)
                            .setThumbnail(playlist.bestThumbnailURL!)
                    ]
                });
                for (const video of Object.values(videos)) { await this.handleVideo(video, message, voiceChannel, true); }
                const playlistAlreadyQueued = this.playlistAlreadyQueued.get(message.guild.id);
                if (!this.client.config.allowDuplicate && Number(playlistAlreadyQueued?.length) > 0) {
                    let num = 1;
                    const songs = playlistAlreadyQueued!.map(s => `**${num++}.** **[${s.title}](${s.url})**`);
                    message.channel.send({
                        embeds: [
                            createEmbed("warn", `Over ${playlistAlreadyQueued!.length} track${playlistAlreadyQueued!.length >= 2 ? "s" : ""} are skipped because it was a duplicate` +
                            ` and this bot configuration disallow duplicated tracks in queue, please use \`${this.client.config.prefix}repeat\` instead`)
                                .setTitle("Already queued / duplicate")
                        ]
                    }).catch(e => this.client.logger.error("PLAY_CMD_ERR:", e));
                    const pages = this.client.util.paginate(songs.join("\n"));
                    let howManyMessage = 0;
                    for (const page of pages) {
                        howManyMessage++;
                        const embed = createEmbed(`warn`, page);
                        if (howManyMessage === 1) embed.setTitle("Duplicated tracks");
                        await message.channel.send({ embeds: [embed] });
                    }
                    playlistAlreadyQueued!.splice(0, playlistAlreadyQueued!.length);
                }
                message.channel.messages.fetch(addingPlaylistVideoMessage.id, { cache: false })
                    .then(m => m.delete()).catch(e => this.client.logger.error("YT_PLAYLIST_ERR:", e));
                return message.channel.send({
                    embeds: [
                        createEmbed("info", `✅ **|** All tracks in **[${playlist.title}](${playlist.url})** playlist has been added to the queue`)
                            .setThumbnail(playlist.bestThumbnailURL!)
                    ]
                });
            } catch (e) {
                this.client.logger.error("YT_PLAYLIST_ERR:", new Error(e.stack));
                return message.channel.send({ embeds: [createEmbed("error", `I could not load the playlist\nError: **\`${e.message}\`**`)] });
            }
        }
        try {
            video = await YouTube.getVideo(url);
        } catch (e) {
            try {
                const videos = await YouTube.searchVideos(searchString, this.client.config.searchMaxResults);
                if (videos.length === 0) return message.channel.send({ embeds: [createEmbed("error", "I could not obtain any search results, please try again")] });
                if (videos.length === 1 || this.client.config.disableSongSelection) {
                    video = await YouTube.getVideo(videos[0].id);
                } else {
                    let index = 0;
                    const msg = await message.channel.send({
                        embeds: [
                            createEmbed("info")
                                .setAuthor("Music Selection", message.client.user?.displayAvatarURL() as string)
                                .setDescription(`\`\`\`${videos.map(video => `${++index} - ${this.cleanTitle(video.title)}`).join("\n")}\`\`\`` +
                                "\nPlease select one of the results ranging from **\`1-10\`**")
                                .setFooter("• Type cancel or c to cancel the music selection")
                        ]
                    });
                    try {
                    // eslint-disable-next-line no-var
                        response = await message.channel.awaitMessages({
                            filter: (msg2: Message) => {
                                if (message.author.id !== msg2.author.id) return false;
                                if (msg2.content === "cancel" || msg2.content === "c") return true;
                                return Number(msg2.content) > 0 && Number(msg2.content) < 13;
                            },
                            max: 1,
                            time: this.client.config.selectTimeout,
                            errors: ["time"]
                        });
                        msg.delete().catch(e => this.client.logger.error("PLAY_CMD_ERR:", e));
                        setTimeout(() => response?.first()?.delete().catch(e => e), 3000);
                    } catch (error) {
                        msg.delete().catch(e => this.client.logger.error("PLAY_CMD_ERR:", e));
                        return message.channel.send({ embeds: [createEmbed("error", "None or invalid value entered, the music selection has canceled")] });
                    }
                    if (response.first()?.content === "c" || response.first()?.content === "cancel") {
                        return message.channel.send({ embeds: [createEmbed("warn", "The music selection has canceled")] });
                    }
                    const videoIndex = parseInt(response.first()?.content as string);
                    video = await YouTube.getVideo(videos[videoIndex - 1].id);
                }
            } catch (err) {
                this.client.logger.error("YT_SEARCH_ERR:", err);
                return message.channel.send({ embeds: [createEmbed("error", `I could not obtain any search results\nError: **\`${err.message}\`**`)] });
            }
        }
        return this.handleVideo(video, message, voiceChannel);
    }

    private async handleVideo(video: Video, message: Message, voiceChannel: VoiceChannel | StageChannel, playlist = false): Promise<any> {
        const song: ISong = {
            download: () => video.download("audio"),
            id: video.id,
            thumbnail: video.bestThumbnailURL!,
            title: this.cleanTitle(video.title),
            url: video.url
        };
        if (message.guild?.queue) {
            if (!this.client.config.allowDuplicate && message.guild.queue.songs.find(s => s.id === song.id)) {
                if (playlist) {
                    const playlistAlreadyQueued = this.playlistAlreadyQueued.get(message.guild.id) ?? [];
                    playlistAlreadyQueued.push(song);
                    this.playlistAlreadyQueued.set(message.guild.id, playlistAlreadyQueued);
                    return undefined;
                }
                return message.channel.send({
                    embeds: [
                        createEmbed("warn", `🎶 **|** **[${song.title}](${song.url})** is already queued, ` +
                    `please use **\`${this.client.config.prefix}repeat\`** command instead`)
                            .setTitle("Already Queued")
                            .setThumbnail(song.thumbnail)
                    ]
                });
            }
            message.guild.queue.songs.addSong(song);
            if (!playlist) {
                message.channel.send({
                    embeds: [createEmbed("info", `✅ **|** **[${song.title}](${song.url})** has been added to the queue`).setThumbnail(song.thumbnail)]
                }).catch(e => this.client.logger.error("PLAY_CMD_ERR:", e));
            }
        } else {
            message.guild!.queue = new ServerQueue(message.channel as TextChannel, voiceChannel);
            message.guild?.queue.songs.addSong(song);
            if (!playlist) {
                message.channel.send({
                    embeds: [createEmbed("info", `✅ **|** **[${song.title}](${song.url})** has been added to the queue`).setThumbnail(song.thumbnail)]
                }).catch(e => this.client.logger.error("PLAY_CMD_ERR:", e));
            }
            try {
                const connection = await joinVoiceChannel({
                    channelId: voiceChannel.id,
                    guildId: message.guild!.id,
                    adapterCreator: message.guild!.voiceAdapterCreator,
                    selfDeaf: true
                });
                message.guild!.queue.connection = connection;
            } catch (error) {
                message.guild?.queue.songs.clear();
                message.guild!.queue = null;
                this.client.logger.error("PLAY_CMD_ERR:", error);
                message.channel.send({ embeds: [createEmbed("error", `An error occured while joining the voice channel, reason: **\`${error.message}\`**`)] })
                    .catch(e => this.client.logger.error("PLAY_CMD_ERR:", e));
                return undefined;
            }
            this.play(message.guild!).catch(err => {
                message.channel.send({ embeds: [createEmbed("error", `An error occurred while trying to play track, reason: **\`${err.message}\`**`)] })
                    .catch(e => this.client.logger.error("PLAY_CMD_ERR:", e));
                return this.client.logger.error("PLAY_CMD_ERR:", err);
            });
        }
        return message;
    }

    private async play(guild: Guild): Promise<any> {
        const serverQueue = guild.queue;
        if (!serverQueue) return undefined;
        if (serverQueue.currentPlayer === null) serverQueue.currentPlayer = createAudioPlayer();
        const song = serverQueue.songs.first();
        const timeout = this.client.config.deleteQueueTimeout;
        clearTimeout(disconnectTimer);
        if (!song) {
            serverQueue.oldMusicMessage = null; serverQueue.oldVoiceStateUpdateMessage = null;
            serverQueue.textChannel?.send({
                embeds: [createEmbed("info", `⏹ **|** The music has ended, use **\`${guild.client.config.prefix}play\`** to play some music`)]
            }).catch(e => this.client.logger.error("PLAY_ERR:", e));
            disconnectTimer = setTimeout(() => {
                serverQueue.connection?.disconnect();
                serverQueue.textChannel?.send({
                    embeds: [createEmbed("info", `👋 **|** Left from the voice channel because I've been inactive for too long.`)]
                }).then(m => m.delete()).catch(e => e);
            }, timeout);
            return guild.queue = null;
        }

        const songData = song.download();

        const playerResource = createAudioResource<any>(songData, { inlineVolume: false });

        songData.on("error", err => { err.message = `YTDLError: ${err.message}`; });

        serverQueue.connection?.subscribe(serverQueue.currentPlayer);

        entersState(serverQueue.connection!, VoiceConnectionStatus.Ready, 15 * 1000)
            .then(() => serverQueue.currentPlayer!.play(playerResource))
            .catch(e => {
                if (e.message === "The operation was aborted") e.message = "Could not establish a voice connection within 15 seconds.";
                serverQueue.currentPlayer!.emit("error", new AudioPlayerError(e, playerResource));
            });

        serverQueue.currentPlayer.on("stateChange", (oldState, newState) => {
            if (newState.status === AudioPlayerStatus.Playing) {
                if (oldState.status === AudioPlayerStatus.Paused) return undefined;
                this.client.logger.info(`${this.client.shard ? `[Shard #${this.client.shard.ids[0]}]` : ""} Track: "${song.title}" on ${guild.name} started`);
                serverQueue.textChannel?.send({ embeds: [createEmbed("info", `▶ **|** Started playing: **[${song.title}](${song.url})**`).setThumbnail(song.thumbnail)] })
                    .then(m => serverQueue.oldMusicMessage = m.id)
                    .catch(e => this.client.logger.error("PLAY_ERR:", e));
                return undefined;
            }
            if (newState.status === AudioPlayerStatus.Idle) {
                this.client.logger.info(`${this.client.shard ? `[Shard #${this.client.shard.ids[0]}]` : ""} Track: "${song.title}" on ${guild.name} ended`);
                // eslint-disable-next-line max-statements-per-line
                if (serverQueue.loopMode === loopMode.off) {
                    serverQueue.songs.deleteFirst();
                } else if (serverQueue.loopMode === loopMode.all) {
                    serverQueue.songs.deleteFirst(); serverQueue.songs.addSong(song);
                }
                serverQueue.textChannel?.send({ embeds: [createEmbed("info", `⏹ **|** Stopped playing **[${song.title}](${song.url})**`).setThumbnail(song.thumbnail)] })
                    .then(m => serverQueue.oldMusicMessage = m.id)
                    .catch(e => this.client.logger.error("PLAY_ERR:", e))
                    .finally(() => {
                        serverQueue.currentPlayer = null;
                        this.play(guild).catch(e => {
                            serverQueue.textChannel?.send({ embeds: [createEmbed("error", `An error occurred while trying to play track, reason: **\`${e}\`**`)] })
                                .catch(e => this.client.logger.error("PLAY_ERR:", e));
                            serverQueue.connection?.disconnect();
                            return this.client.logger.error("PLAY_ERR:", e);
                        });
                    });
                return undefined;
            }
        });

        serverQueue.currentPlayer.on("error", err => {
            serverQueue.textChannel?.send({ embeds: [createEmbed("error", `Error while playing music\nReason: \`${err.message}\``)] })
                .catch(e => this.client.logger.error("PLAY_CMD_ERR:", e));
            serverQueue.connection?.disconnect();
            guild.queue = null;
            this.client.logger.error("PLAY_ERR:", err);
        });
    }

    private cleanTitle(title: string): string {
        return Util.escapeMarkdown(decodeHTML(title));
    }
}
