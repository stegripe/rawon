import { clearInterval, clearTimeout, setInterval } from "node:timers";
import type { AudioPlayer, AudioPlayerPlayingState, AudioResource, VoiceConnection } from "@discordjs/voice";
import { AudioPlayerStatus, createAudioPlayer } from "@discordjs/voice";
import type { TextChannel, Snowflake } from "discord.js";
import i18n from "../config/index.js";
import type { LoopMode, QueueSong } from "../typings/index.js";
import { createEmbed } from "../utils/functions/createEmbed.js";
import type { filterArgs } from "../utils/functions/ffmpegArgs.js";
import { play } from "../utils/handlers/GeneralUtil.js";
import { SongManager } from "../utils/structures/SongManager.js";
import type { Rawon } from "./Rawon.js";

const nonEnum = { enumerable: false };

export class ServerQueue {
    public readonly player: AudioPlayer = createAudioPlayer();
    public connection: VoiceConnection | null = null;
    public timeout: NodeJS.Timeout | null = null;
    public readonly songs: SongManager;
    public loopMode: LoopMode = "OFF";
    public shuffle = false;
    public filters: Partial<Record<keyof typeof filterArgs, boolean>> = {};
    public playerUpdateInterval: NodeJS.Timeout | null = null;

    private _volume = this.client.config.defaultVolume;
    private _lastVSUpdateMsg: Snowflake | null = null;
    private _lastMusicMsg: Snowflake | null = null;
    private _skipVoters: Snowflake[] = [];

    public constructor(public readonly textChannel: TextChannel) {
        Object.defineProperties(this, {
            _skipVoters: nonEnum,
            _lastMusicMsg: nonEnum,
            _lastVSUpdateMsg: nonEnum,
            _volume: nonEnum
        });

        this.songs = new SongManager(this.client, this.textChannel.guild);

        // Load saved state from data.json
        this.loadSavedState();

        this.player
            .on("stateChange", async (oldState, newState) => {
                if (newState.status === AudioPlayerStatus.Playing && oldState.status !== AudioPlayerStatus.Paused) {
                    newState.resource.volume?.setVolumeLogarithmic(this.volume / 100);

                    const newSong = ((this.player.state as AudioPlayerPlayingState).resource.metadata as QueueSong)
                        .song;
                    
                    // Only send "started playing" message if NOT in request channel
                    const isRequestChannel = this.client.requestChannelManager.isRequestChannel(this.textChannel.guild, this.textChannel.id);
                    if (isRequestChannel) {
                        // Just log it without sending message
                        this.client.logger.info(
                            `${this.client.shard ? `[Shard #${this.client.shard.ids[0]}]` : ""} Track: "${newSong.title}" on ${this.textChannel.guild.name} has started.`
                        );
                    } else {
                        this.sendStartPlayingMsg(newSong);
                    }
                    
                    // Update request channel player message
                    void this.client.requestChannelManager.updatePlayerMessage(this.textChannel.guild);
                    
                    // Start player update interval (every 15 seconds) for request channel
                    this.playerUpdateInterval ??= setInterval(() => {
                        if (this.playing) {
                            void this.client.requestChannelManager.updatePlayerMessage(this.textChannel.guild);
                        }
                    }, 15_000);
                } else if (newState.status === AudioPlayerStatus.Idle) {
                    const song = (oldState as AudioPlayerPlayingState).resource.metadata as QueueSong;
                    this.client.logger.info(
                        `${this.client.shard ? `[Shard #${this.client.shard.ids[0]}]` : ""} Track: "${song.song.title
                        }" on ${this.textChannel.guild.name} has ended.`
                    );
                    this.skipVoters = [];
                    if (this.loopMode === "OFF") {
                        this.songs.delete(song.key);
                    }

                    const nextS =
                         
                        this.shuffle && this.loopMode !== "SONG"
                            ? this.songs.random()?.key
                            : this.loopMode === "SONG"
                                ? song.key
                                : this.songs
                                    .sortByIndex()
                                    .filter(x => x.index > song.index)
                                    .first()?.key ??
                                (this.loopMode === "QUEUE" ? this.songs.sortByIndex().first()?.key ?? "" : "");

                    // Update request channel player message
                    void this.client.requestChannelManager.updatePlayerMessage(this.textChannel.guild);

                    // Only send "stopped playing" message if NOT in request channel
                    const isRequestChannel = this.client.requestChannelManager.isRequestChannel(this.textChannel.guild, this.textChannel.id);
                    if (!isRequestChannel) {
                        await this.textChannel
                            .send({
                                embeds: [
                                    createEmbed(
                                        "info",
                                        `⏹ **|** ${i18n.__mf("utils.generalHandler.stopPlaying", {
                                            song: `[${song.song.title}](${song.song.url})`
                                        })}`
                                    ).setThumbnail(song.song.thumbnail)
                                ]
                            })
                            .then(ms => (this.lastMusicMsg = ms.id))
                            .catch((error: unknown) => this.client.logger.error("PLAY_ERR:", error));
                    }

                    // Play next song
                    try {
                        await play(this.textChannel.guild, nextS);
                    } catch (error) {
                        if (!isRequestChannel) {
                            try {
                                await this.textChannel.send({
                                    embeds: [
                                        createEmbed(
                                            "error",
                                            i18n.__mf("utils.generalHandler.errorPlaying", {
                                                message: `\`${error as string}\``
                                            }),
                                            true
                                        )
                                    ]
                                });
                            } catch (playError) {
                                this.client.logger.error("PLAY_ERR:", playError);
                            }
                        }
                        this.connection?.disconnect();
                        this.client.logger.error("PLAY_ERR:", error);
                    }
                }
            })
            .on("error", err => {
                (async () => {
                    // eslint-disable-next-line promise/no-promise-in-callback
                    await this.textChannel
                    .send({
                        embeds: [
                            createEmbed(
                                "error",
                                i18n.__mf("utils.generalHandler.errorPlaying", { message: `\`${err.message}\`` }),
                                true
                            )
                        ]
                    })
                    .catch((error: unknown) => this.client.logger.error("PLAY_CMD_ERR:", error));
                })();
                this.destroy();
                this.client.logger.error("PLAY_ERR:", err);
            })
            .on("debug", message => {
                this.client.logger.debug(message);
            });
    }

    private loadSavedState(): void {
        const savedState = this.client.data.data?.[this.textChannel.guild.id]?.playerState;
        if (savedState) {
            this.loopMode = savedState.loopMode ?? "OFF";
            this.shuffle = savedState.shuffle ?? false;
            this._volume = savedState.volume ?? this.client.config.defaultVolume;
            this.filters = (savedState.filters ?? {}) as Partial<Record<keyof typeof filterArgs, boolean>>;
            this.client.logger.info(`Loaded saved player state for guild ${this.textChannel.guild.name}`);
        }
    }

    public async saveState(): Promise<void> {
        const currentData = this.client.data.data ?? {};
        const guildData = currentData[this.textChannel.guild.id] ?? {};

        guildData.playerState = {
            loopMode: this.loopMode,
            shuffle: this.shuffle,
            volume: this._volume,
            filters: this.filters as Record<string, boolean>
        };

        await this.client.data.save(() => ({
            ...currentData,
            [this.textChannel.guild.id]: guildData
        }));
    }

    public setFilter(filter: keyof typeof filterArgs, state: boolean): void {
        const before = this.filters[filter];
        this.filters[filter] = state;

        // Save state when filter changes
        void this.saveState();

        if (before !== state && this.player.state.status === AudioPlayerStatus.Playing) {
            this.playing = false;
            void play(this.textChannel.guild, (this.player.state.resource as AudioResource<QueueSong>).metadata.key, true);
        }
    }

    public setLoopMode(mode: LoopMode): void {
        this.loopMode = mode;
        void this.saveState();
    }

    public setShuffle(value: boolean): void {
        this.shuffle = value;
        void this.saveState();
    }

    public stop(): void {
        this.songs.clear();
        this.player.stop(true);
    }

    public destroy(): void {
        this.stop();
        this.connection?.disconnect();
        clearTimeout(this.timeout ?? undefined);
        if (this.playerUpdateInterval !== null) {
            clearInterval(this.playerUpdateInterval);
            this.playerUpdateInterval = null;
        }
        delete this.textChannel.guild.queue;
    }

    public get volume(): number {
        return this._volume;
    }

    public set volume(newVol: number) {
        this._volume = newVol;
        (
            this.player.state as AudioPlayerPlayingState & { resource: AudioResource | undefined }
        ).resource.volume?.setVolumeLogarithmic(this._volume / 100);
        // Save state when volume changes
        void this.saveState();
    }

    public get skipVoters(): Snowflake[] {
        return this._skipVoters;
    }

    public set skipVoters(value: Snowflake[]) {
        this._skipVoters = value;
    }

    public get lastMusicMsg(): Snowflake | null {
        return this._lastMusicMsg;
    }

    public set lastMusicMsg(value: Snowflake | null) {
        if (this._lastMusicMsg !== null) {
            (async () => {
                await this.textChannel.messages
                .fetch(this._lastMusicMsg ?? "")
                .then(msg => {
                    void msg.delete();
                    return 0;
                })
                .catch((error: unknown) => this.textChannel.client.logger.error("DELETE_LAST_MUSIC_MESSAGE_ERR:", error))
            })();
        }
        this._lastMusicMsg = value;
    }

    public get lastVSUpdateMsg(): Snowflake | null {
        return this._lastVSUpdateMsg;
    }

    public set lastVSUpdateMsg(value: Snowflake | null) {
        if (this._lastVSUpdateMsg !== null) {
            (async () => {
                await this.textChannel.messages
                .fetch(this._lastVSUpdateMsg ?? "")
                .then(msg => {
                    void msg.delete();
                    return 0;
                })
                .catch((error: unknown) => this.textChannel.client.logger.error("DELETE_LAST_VS_UPDATE_MESSAGE_ERR:", error))
            })();
        }
        this._lastVSUpdateMsg = value;
    }

    public get playing(): boolean {
        return this.player.state.status === AudioPlayerStatus.Playing;
    }

    public set playing(value: boolean) {
        if (value) {
            this.player.unpause();
        } else {
            this.player.pause();
        }
    }

    public get idle(): boolean {
        return this.player.state.status === AudioPlayerStatus.Idle && this.songs.size === 0;
    }

    public get client(): Rawon {
        return this.textChannel.client as Rawon;
    }

    private sendStartPlayingMsg(newSong: QueueSong["song"]): void {
        this.client.logger.info(
            `${this.client.shard ? `[Shard #${this.client.shard.ids[0]}]` : ""} Track: "${newSong.title}" on ${this.textChannel.guild.name
            } has started.`
        );
        (async () => {
            await this.textChannel
            .send({
                embeds: [
                    createEmbed(
                        "info",
                        `▶ **|** ${i18n.__mf("utils.generalHandler.startPlaying", {
                            song: `[${newSong.title}](${newSong.url})`
                        })}`
                    ).setThumbnail(newSong.thumbnail)
                ]
            })
            .then(ms => (this.lastMusicMsg = ms.id))
            .catch((error: unknown) => this.client.logger.error("PLAY_ERR:", error))
        })();
    }
}
