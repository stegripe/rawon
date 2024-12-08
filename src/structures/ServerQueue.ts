import { clearTimeout } from "node:timers";
import type { AudioPlayer, AudioPlayerPlayingState, AudioResource, VoiceConnection } from "@discordjs/voice";
import { AudioPlayerStatus, createAudioPlayer } from "@discordjs/voice";
import type { TextChannel, Snowflake } from "discord.js";
import i18n from "../config/index.js";
import type { LoopMode, QueueSong } from "../typings/index.js";
import { createEmbed } from "../utils/functions/createEmbed.js";
import type { filterArgs } from "../utils/functions/ffmpegArgs.js";
import { play } from "../utils/handlers/GeneralUtil.js";
import { destroyStream, killProcess } from "../utils/handlers/YTDLUtil.js"; // Import cleanup functions
import { SongManager } from "../utils/structures/SongManager.js";
import type { Rawon } from "./Rawon.js";

const nonEnum = { enumerable: false };

export class ServerQueue {
    public stayInVC = this.client.config.stayInVCAfterFinished;
    public readonly player: AudioPlayer = createAudioPlayer();
    public connection: VoiceConnection | null = null;
    public dcTimeout: NodeJS.Timeout | null = null;
    public timeout: NodeJS.Timeout | null = null;
    public readonly songs: SongManager;
    public loopMode: LoopMode = "OFF";
    public shuffle = false;
    public filters: Partial<Record<keyof typeof filterArgs, boolean>> = {};

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

        this.player
            .on("stateChange", async (oldState, newState) => {
                if (newState.status === AudioPlayerStatus.Playing && oldState.status !== AudioPlayerStatus.Paused) {
                    newState.resource.volume?.setVolumeLogarithmic(this.volume / 100);

                    const newSong = ((this.player.state as AudioPlayerPlayingState).resource.metadata as QueueSong)
                        .song;
                    await this.sendStartPlayingMsg(newSong);
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

                    const nextSong = this.shuffle && this.loopMode !== "SONG"
                        ? this.songs.random()?.key
                        : this.loopMode === "SONG"
                            ? song.key
                            : this.songs.sortByIndex().filter(x => x.index > song.index).first()?.key
                            ?? (this.loopMode === "QUEUE" ? this.songs.sortByIndex().first()?.key ?? "" : "");

                    if (nextSong === null || nextSong === undefined || nextSong === "") {
                        destroyStream();
                        killProcess();
                    }

                    try {
                        await play(this.textChannel.guild, nextSong);
                    } catch (error) {
                        await this.textChannel
                            .send({
                                embeds: [
                                    createEmbed(
                                        "error",
                                        i18n.__mf("utils.generalHandler.errorPlaying", {
                                            message: `\`${error as string}\``
                                        }),
                                        true
                                    )
                                ]
                            })
                            .catch((nestedError: unknown) => this.client.logger.error("PLAY_ERR:", nestedError));
                        this.connection?.disconnect();
                        this.client.logger.error("PLAY_ERR:", error);
                    }                    
                }
            })
            .on("error", async (error) => {
                try {
                    await this.textChannel.send({
                        embeds: [
                            createEmbed(
                                "error",
                                i18n.__mf("utils.generalHandler.errorPlaying", { message: `\`${error.message}\`` }),
                                true
                            )
                        ]
                    });
                } catch (sendError) {
                    this.client.logger.error("PLAY_CMD_ERR:", sendError);
                }
                this.destroy();
                this.client.logger.error("PLAY_ERR:", error);
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

        // Cleanup resources
        destroyStream();
        killProcess();
    }

    public destroy(): void {
        this.stop(); // Stop the queue and cleanup
        this.connection?.disconnect();
        clearTimeout(this.timeout ?? undefined);
        clearTimeout(this.dcTimeout ?? undefined);

        // Delete the queue reference
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
            (async () => {
                try {
                    const msg = await this.textChannel.messages.fetch(this._lastMusicMsg ?? "");
                    void msg.delete();
                } catch (error) {
                    this.textChannel.client.logger.error("DELETE_LAST_MUSIC_MESSAGE_ERR:", error);
                }
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
                try {
                    const msg = await this.textChannel.messages.fetch(this._lastVSUpdateMsg ?? "");
                    void msg.delete();
                } catch (error) {
                    this.textChannel.client.logger.error("DELETE_LAST_VS_UPDATE_MESSAGE_ERR:", error);
                }
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

    private async sendStartPlayingMsg(newSong: QueueSong["song"]): Promise<void> {
        this.client.logger.info(
            `${this.client.shard ? `[Shard #${this.client.shard.ids[0]}]` : ""} Track: "${newSong.title}" on ${this.textChannel.guild.name
            } has started.`
        );
        try {
            const ms = await this.textChannel.send({
                embeds: [
                    createEmbed(
                        "info",
                        `▶ **|** ${i18n.__mf("utils.generalHandler.startPlaying", {
                            song: `[${newSong.title}](${newSong.url})`
                        })}`
                    ).setThumbnail(newSong.thumbnail)
                ]
            });
            this.lastMusicMsg = ms.id;
        } catch (error) {
            this.client.logger.error("PLAY_ERR:", error);
        }
    }
}
