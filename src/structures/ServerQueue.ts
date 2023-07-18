import { SongManager } from "../utils/structures/SongManager.js";
import { createEmbed } from "../utils/functions/createEmbed.js";
import { filterArgs } from "../utils/functions/ffmpegArgs.js";
import { LoopMode, QueueSong } from "../typings/index.js";
import { play } from "../utils/handlers/GeneralUtil.js";
import i18n from "../config/index.js";
import { Rawon } from "./Rawon.js";
import { AudioPlayer, AudioPlayerPlayingState, AudioPlayerStatus, AudioResource, createAudioPlayer, VoiceConnection } from "@discordjs/voice";
import { TextChannel, Snowflake } from "discord.js";

const nonEnum = { enumerable: false };

export class ServerQueue {
    public stayInVC = this.textChannel.client.config.stayInVCAfterFinished;
    public readonly player: AudioPlayer = createAudioPlayer();
    public connection: VoiceConnection | null = null;
    public dcTimeout: NodeJS.Timeout | null = null;
    public timeout: NodeJS.Timeout | null = null;
    public readonly songs = new SongManager(this.client, this.textChannel.guild);
    public loopMode: LoopMode = "OFF";
    public shuffle = false;
    public filters: Partial<Record<keyof typeof filterArgs, boolean>> = {};

    private _lastVSUpdateMsg: Snowflake | null = null;
    private _lastMusicMsg: Snowflake | null = null;
    private _skipVoters: Snowflake[] = [];
    private _volume = 100;

    public constructor(public readonly textChannel: TextChannel) {
        Object.defineProperties(this, {
            _skipVoters: nonEnum,
            _lastMusicMsg: nonEnum,
            _lastVSUpdateMsg: nonEnum,
            _volume: nonEnum
        });

        this.player
            .on("stateChange", (oldState, newState) => {
                if (newState.status === AudioPlayerStatus.Playing && oldState.status !== AudioPlayerStatus.Paused) {
                    newState.resource.volume?.setVolumeLogarithmic(this.volume / 100);

                    const newSong = ((this.player.state as AudioPlayerPlayingState).resource.metadata as QueueSong)
                        .song;
                    this.sendStartPlayingMsg(newSong);
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
                        // eslint-disable-next-line no-nested-ternary
                        this.shuffle && this.loopMode !== "SONG"
                            ? this.songs.random()?.key
                            : this.loopMode === "SONG"
                                ? song.key
                                : this.songs
                                    .sortByIndex()
                                    .filter(x => x.index > song.index)
                                    .first()?.key ??
                                (this.loopMode === "QUEUE" ? this.songs.sortByIndex().first()?.key ?? "" : "");

                    this.textChannel
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
                        .then(m => (this.lastMusicMsg = m.id))
                        .catch(e => this.client.logger.error("PLAY_ERR:", e))
                        .finally(() => {
                            play(this.textChannel.guild, nextS).catch(e => {
                                this.textChannel
                                    .send({
                                        embeds: [
                                            createEmbed(
                                                "error",
                                                i18n.__mf("utils.generalHandler.errorPlaying", {
                                                    message: `\`${e as string}\``
                                                }),
                                                true
                                            )
                                        ]
                                    })
                                    .catch(er => this.client.logger.error("PLAY_ERR:", er));
                                this.connection?.disconnect();
                                return this.client.logger.error("PLAY_ERR:", e);
                            });
                        });
                }
            })
            .on("error", err => {
                this.textChannel
                    .send({
                        embeds: [
                            createEmbed(
                                "error",
                                i18n.__mf("utils.generalHandler.errorPlaying", { message: `\`${err.message}\`` }),
                                true
                            )
                        ]
                    })
                    .catch(e => this.client.logger.error("PLAY_CMD_ERR:", e));
                this.destroy();
                this.client.logger.error("PLAY_ERR:", err);
            })
            .on("debug", message => {
                this.client.logger.debug(message);
            });
    }

    public setFilter(filter: keyof typeof filterArgs, state: boolean): void {
        const before = this.filters[filter];
        this.filters[filter] = state;

        if (before !== state && this.player.state.status === AudioPlayerStatus.Playing) {
            this.playing = false;
            void play(this.textChannel.guild, (this.player.state.resource as AudioResource<QueueSong>).metadata.key, true);
        }
    }

    public stop(): void {
        this.songs.clear();
        this.player.stop(true);
    }

    public destroy(): void {
        this.stop();
        this.connection?.disconnect();
        clearTimeout(this.timeout!);
        clearTimeout(this.dcTimeout!);
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
            this.textChannel.messages
                .fetch(this._lastMusicMsg)
                .then(msg => {
                    void msg.delete();
                })
                .catch(err => this.textChannel.client.logger.error("DELETE_LAST_MUSIC_MESSAGE_ERR:", err));
        }
        this._lastMusicMsg = value;
    }

    public get lastVSUpdateMsg(): Snowflake | null {
        return this._lastVSUpdateMsg;
    }

    public set lastVSUpdateMsg(value: Snowflake | null) {
        if (this._lastVSUpdateMsg !== null) {
            this.textChannel.messages
                .fetch(this._lastVSUpdateMsg)
                .then(msg => {
                    void msg.delete();
                })
                .catch(err => this.textChannel.client.logger.error("DELETE_LAST_VS_UPDATE_MESSAGE_ERR:", err));
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
        this.textChannel
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
            .then(m => (this.lastMusicMsg = m.id))
            .catch(e => this.client.logger.error("PLAY_ERR:", e));
    }
}
