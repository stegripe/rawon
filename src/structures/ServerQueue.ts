import { clearInterval, clearTimeout, setInterval, setTimeout } from "node:timers";
import {
    type AudioPlayer,
    type AudioPlayerPlayingState,
    AudioPlayerStatus,
    type AudioResource,
    createAudioPlayer,
    type VoiceConnection,
} from "@discordjs/voice";
import { type Snowflake, type TextChannel } from "discord.js";
import i18n from "../config/index.js";
import { type LoopMode, type QueueSong, type SavedQueueSong } from "../typings/index.js";
import { createEmbed } from "../utils/functions/createEmbed.js";
import { type filterArgs } from "../utils/functions/ffmpegArgs.js";
import { play } from "../utils/handlers/GeneralUtil.js";
import { SongManager } from "../utils/structures/SongManager.js";
import { type Rawon } from "./Rawon.js";

const nonEnum = { enumerable: false };

export class ServerQueue {
    public readonly player: AudioPlayer = createAudioPlayer();
    public connection: VoiceConnection | null = null;
    public timeout: NodeJS.Timeout | null = null;
    public readonly songs: SongManager;
    public loopMode: LoopMode = "OFF";
    public shuffle = false;
    public filters: Partial<Record<keyof typeof filterArgs, boolean>> = {};
    public seekOffset = 0;

    private _volume = 100;
    private _lastVSUpdateMsg: Snowflake | null = null;
    private _lastMusicMsg: Snowflake | null = null;
    private _skipVoters: Snowflake[] = [];
    private _skipInProgress = false;
    private _lastSkipTime = 0;
    private _skipCooldownMs = 2000;
    private _positionSaveInterval: NodeJS.Timeout | null = null;

    public constructor(public readonly textChannel: TextChannel) {
        Object.defineProperties(this, {
            _skipVoters: nonEnum,
            _lastMusicMsg: nonEnum,
            _lastVSUpdateMsg: nonEnum,
            _volume: nonEnum,
            _skipInProgress: nonEnum,
            _lastSkipTime: nonEnum,
            _skipCooldownMs: nonEnum,
            _positionSaveInterval: nonEnum,
        });

        this.songs = new SongManager(this.client, this.textChannel.guild);

        this.loadSavedState();

        this.player
            .on("stateChange", async (oldState, newState) => {
                if (
                    newState.status === AudioPlayerStatus.Playing &&
                    oldState.status !== AudioPlayerStatus.Paused
                ) {
                    this.endSkip();
                    newState.resource.volume?.setVolumeLogarithmic(this.volume / 100);

                    const currentSong = (this.player.state as AudioPlayerPlayingState).resource
                        .metadata as QueueSong;
                    const newSong = currentSong.song;

                    const isRequestChannel = this.client.requestChannelManager.isRequestChannel(
                        this.textChannel.guild,
                        this.textChannel.id,
                    );
                    if (isRequestChannel) {
                        this.client.logger.info(
                            `${this.client.shard ? `[Shard #${this.client.shard.ids[0]}]` : ""} Track: "${newSong.title}" on ${this.textChannel.guild.name} has started.`,
                        );
                    } else {
                        this.sendStartPlayingMsg(newSong);
                    }

                    void this.client.requestChannelManager.updatePlayerMessage(
                        this.textChannel.guild,
                    );

                    void this.saveQueueState();

                    this.startPositionSaveInterval();

                    this.preCacheNextSong(currentSong);
                } else if (newState.status === AudioPlayerStatus.Idle) {
                    this.stopPositionSaveInterval();

                    const song = (oldState as AudioPlayerPlayingState).resource
                        .metadata as QueueSong;
                    this.client.logger.info(
                        `${this.client.shard ? `[Shard #${this.client.shard.ids[0]}]` : ""} Track: "${
                            song.song.title
                        }" on ${this.textChannel.guild.name} has ended.`,
                    );
                    this.skipVoters = [];
                    if (this.loopMode === "OFF") {
                        this.songs.delete(song.key);
                    }

                    let nextS: string | undefined;
                    if (this.shuffle && this.loopMode !== "SONG") {
                        nextS = this.songs.random()?.key;
                    } else if (this.loopMode === "SONG") {
                        if (this.songs.has(song.key)) {
                            nextS = song.key;
                        } else {
                            const sortedSongs = this.songs.sortByIndex();
                            nextS =
                                sortedSongs.filter((x) => x.index > song.index).first()?.key ??
                                sortedSongs.first()?.key;
                        }
                    } else {
                        const sortedSongs = this.songs.sortByIndex();
                        nextS =
                            sortedSongs.filter((x) => x.index > song.index).first()?.key ??
                            (this.loopMode === "QUEUE" ? (sortedSongs.first()?.key ?? "") : "");
                    }

                    void this.client.requestChannelManager.updatePlayerMessage(
                        this.textChannel.guild,
                    );

                    const isRequestChannel = this.client.requestChannelManager.isRequestChannel(
                        this.textChannel.guild,
                        this.textChannel.id,
                    );
                    if (!isRequestChannel) {
                        await this.textChannel
                            .send({
                                embeds: [
                                    createEmbed(
                                        "info",
                                        `⏹️ **|** ${i18n.__mf("utils.generalHandler.stopPlaying", {
                                            song: `[${song.song.title}](${song.song.url})`,
                                        })}`,
                                    ).setThumbnail(song.song.thumbnail),
                                ],
                            })
                            .then((ms) => (this.lastMusicMsg = ms.id))
                            .catch((error: unknown) =>
                                this.client.logger.error("PLAY_ERR:", error),
                            );
                    }

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
                                                message: `\`${error as string}\``,
                                            }),
                                            true,
                                        ),
                                    ],
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
            .on("error", (err) => {
                (async () => {
                    const isRequestChannel = this.client.requestChannelManager.isRequestChannel(
                        this.textChannel.guild,
                        this.textChannel.id,
                    );

                    const errorMsg = await this.textChannel
                        .send({
                            embeds: [
                                createEmbed(
                                    "error",
                                    i18n.__mf("utils.generalHandler.errorPlaying", {
                                        message: `\`${err.message}\``,
                                    }),
                                    true,
                                ),
                            ],
                        })
                        .catch((error: unknown) => {
                            this.client.logger.error("PLAY_CMD_ERR:", error);
                            return null;
                        });

                    if (isRequestChannel && errorMsg) {
                        setTimeout(() => {
                            errorMsg.delete().catch(() => null);
                        }, 60_000);
                    }
                })();
                this.destroy();
                this.client.logger.error("PLAY_ERR:", err);
            })
            .on("debug", (message) => {
                this.client.logger.debug(message);
            });
    }

    private loadSavedState(): void {
        const savedState = this.client.data.data?.[this.textChannel.guild.id]?.playerState;
        if (savedState) {
            this.loopMode = savedState.loopMode ?? "OFF";
            this.shuffle = savedState.shuffle ?? false;
            this._volume = savedState.volume ?? 100;
            this.filters = (savedState.filters ?? {}) as Partial<
                Record<keyof typeof filterArgs, boolean>
            >;
            this.client.logger.info(
                `Loaded saved player state for guild ${this.textChannel.guild.name}`,
            );
        }
    }

    public async saveState(): Promise<void> {
        const currentData = this.client.data.data ?? {};
        const guildData = currentData[this.textChannel.guild.id] ?? {};

        guildData.playerState = {
            loopMode: this.loopMode,
            shuffle: this.shuffle,
            volume: this._volume,
            filters: this.filters as Record<string, boolean>,
        };

        await this.client.data.save(() => ({
            ...currentData,
            [this.textChannel.guild.id]: guildData,
        }));
    }

    public async saveQueueState(): Promise<void> {
        const currentData = this.client.data.data ?? {};
        const guildData = currentData[this.textChannel.guild.id] ?? {};

        let currentSongKey: string | null = null;
        let currentPosition = 0;
        if (this.player.state.status === AudioPlayerStatus.Playing) {
            const resource = (this.player.state as AudioPlayerPlayingState).resource;
            const metadata = resource.metadata as QueueSong | undefined;
            if (metadata !== undefined) {
                currentSongKey = metadata.key;
                currentPosition =
                    Math.floor((resource.playbackDuration ?? 0) / 1000) + this.seekOffset;
            }
        }

        const savedSongs: SavedQueueSong[] = this.songs.sortByIndex().map((queueSong) => ({
            requesterId: queueSong.requester.id,
            index: queueSong.index,
            song: queueSong.song,
            key: queueSong.key,
        }));

        const voiceChannelId = this.connection?.joinConfig.channelId;
        if (
            voiceChannelId === undefined ||
            voiceChannelId === null ||
            voiceChannelId.length === 0
        ) {
            return;
        }

        guildData.queueState = {
            textChannelId: this.textChannel.id,
            voiceChannelId,
            songs: savedSongs,
            currentSongKey,
            currentPosition,
        };

        await this.client.data.save(() => ({
            ...currentData,
            [this.textChannel.guild.id]: guildData,
        }));
    }

    public async clearQueueState(): Promise<void> {
        const currentData = this.client.data.data ?? {};
        const guildData = currentData[this.textChannel.guild.id] ?? {};

        delete guildData.queueState;

        await this.client.data.save(() => ({
            ...currentData,
            [this.textChannel.guild.id]: guildData,
        }));
    }

    public setFilter(filter: keyof typeof filterArgs, state: boolean): void {
        const before = this.filters[filter];
        this.filters[filter] = state;

        void this.saveState();

        if (before !== state && this.player.state.status === AudioPlayerStatus.Playing) {
            const resource = (this.player.state as AudioPlayerPlayingState).resource;
            const currentPosition =
                Math.floor((resource.playbackDuration ?? 0) / 1000) + this.seekOffset;

            this.seekOffset = currentPosition;

            this.playing = false;
            void play(
                this.textChannel.guild,
                (resource as AudioResource<QueueSong>).metadata.key,
                true,
                currentPosition,
            );
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
        this.stopPositionSaveInterval();
        this.songs.clear();
        this.player.stop(true);
    }

    public destroy(): void {
        this.stop();
        this.connection?.disconnect();
        clearTimeout(this.timeout ?? undefined);
        void this.clearQueueState();
        delete this.textChannel.guild.queue;
    }

    private startPositionSaveInterval(): void {
        this.stopPositionSaveInterval();
        this._positionSaveInterval = setInterval(() => {
            void this.saveQueueState();
        }, 5000);
    }

    private stopPositionSaveInterval(): void {
        if (this._positionSaveInterval !== null) {
            clearInterval(this._positionSaveInterval);
            this._positionSaveInterval = null;
        }
    }

    public get volume(): number {
        return this._volume;
    }

    public set volume(newVol: number) {
        this._volume = newVol;
        (
            this.player.state as AudioPlayerPlayingState & { resource: AudioResource | undefined }
        ).resource.volume?.setVolumeLogarithmic(this._volume / 100);
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
                    .then((msg) => {
                        void msg.delete();
                        return 0;
                    })
                    .catch((error: unknown) =>
                        this.textChannel.client.logger.error(
                            "DELETE_LAST_MUSIC_MESSAGE_ERR:",
                            error,
                        ),
                    );
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
                    .then((msg) => {
                        void msg.delete();
                        return 0;
                    })
                    .catch((error: unknown) =>
                        this.textChannel.client.logger.error(
                            "DELETE_LAST_VS_UPDATE_MESSAGE_ERR:",
                            error,
                        ),
                    );
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
            `${this.client.shard ? `[Shard #${this.client.shard.ids[0]}]` : ""} Track: "${newSong.title}" on ${
                this.textChannel.guild.name
            } has started.`,
        );
        (async () => {
            await this.textChannel
                .send({
                    embeds: [
                        createEmbed(
                            "info",
                            `▶️ **|** ${i18n.__mf("utils.generalHandler.startPlaying", {
                                song: `[${newSong.title}](${newSong.url})`,
                            })}`,
                        ).setThumbnail(newSong.thumbnail),
                    ],
                })
                .then((ms) => (this.lastMusicMsg = ms.id))
                .catch((error: unknown) => this.client.logger.error("PLAY_ERR:", error));
        })();
    }

    private preCacheNextSong(currentSong: QueueSong): void {
        if (this.loopMode === "SONG") {
            return;
        }

        const songsToCache: string[] = [];
        const PRE_CACHE_AHEAD = 3;

        if (this.shuffle) {
            const availableSongs = this.songs.filter(
                (s) => s.key !== currentSong.key && !s.song.isLive,
            );
            const songsArray = Array.from(availableSongs.values());
            const shuffled = songsArray.sort(() => 0.5 - Math.random());
            const selected = shuffled.slice(0, Math.min(PRE_CACHE_AHEAD, songsArray.length));

            for (const song of selected) {
                songsToCache.push(song.song.url);
            }
        } else {
            const sortedSongs = this.songs.sortByIndex();
            const nextSongsArray = Array.from(
                sortedSongs.filter((s) => s.index > currentSong.index && !s.song.isLive).values(),
            ).slice(0, PRE_CACHE_AHEAD);

            for (const song of nextSongsArray) {
                songsToCache.push(song.song.url);
            }

            if (songsToCache.length < PRE_CACHE_AHEAD && this.loopMode === "QUEUE") {
                const remaining = PRE_CACHE_AHEAD - songsToCache.length;
                const fromStartArray = Array.from(
                    sortedSongs
                        .filter((s) => !s.song.isLive && !songsToCache.includes(s.song.url))
                        .values(),
                ).slice(0, remaining);

                for (const song of fromStartArray) {
                    songsToCache.push(song.song.url);
                }
            }
        }

        if (songsToCache.length > 0) {
            void this.client.audioCache.preCacheMultiple(songsToCache);
        }
    }

    public get skipInProgress(): boolean {
        return this._skipInProgress;
    }

    public canSkip(): boolean {
        if (this._skipInProgress) {
            return false;
        }
        const now = Date.now();
        if (now - this._lastSkipTime < this._skipCooldownMs) {
            return false;
        }
        return true;
    }

    public startSkip(): boolean {
        if (!this.canSkip()) {
            return false;
        }
        this._skipInProgress = true;
        this._lastSkipTime = Date.now();
        return true;
    }

    public endSkip(): void {
        this._skipInProgress = false;
    }
}
