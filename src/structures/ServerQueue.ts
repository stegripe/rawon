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
import { enableAudioCache } from "../config/env.js";
import { type LoopMode, type QueueSong, type SavedQueueSong } from "../typings/index.js";
import { createEmbed } from "../utils/functions/createEmbed.js";
import { type filterArgs } from "../utils/functions/ffmpegArgs.js";
import { i18n__mf } from "../utils/functions/i18n.js";
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
    private _suppressPlayerErrors = false;
    private _pendingCacheUrls: string[] = [];

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
            _suppressPlayerErrors: nonEnum,
        });

        this.songs = new SongManager(this.client, this.textChannel.guild);

        this.loadSavedState();

        this.player
            .on("stateChange", async (oldState, newState) => {
                const __mf = i18n__mf(this.client, this.textChannel.guild);
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
                    try {
                        const playingResource = (this.player.state as AudioPlayerPlayingState | any)
                            .resource as AudioResource | undefined;
                        const playbackMs = playingResource?.playbackDuration ?? null;
                        this.client.logger.debug(
                            "[ServerQueue] IdleHandler - previous resource playbackDurationMs",
                            {
                                guild: this.textChannel.guild.id,
                                playbackDurationMs: playbackMs,
                            },
                        );
                    } catch {
                        // Ignore errors
                    }
                    try {
                        const upcoming = this.songs.sortByIndex().map((s) => s.key);
                        this.client.logger.debug("[ServerQueue] IdleHandler - queueState", {
                            guild: this.textChannel.guild.id,
                            songsSize: this.songs.size,
                            loopMode: this.loopMode,
                            shuffle: this.shuffle,
                            upcomingKeys: upcoming as string[],
                        });
                    } catch {
                        this.client.logger.debug(
                            "[ServerQueue] IdleHandler - queueState (failed to serialize)",
                        );
                    }
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

                    this.client.logger.debug("[ServerQueue] IdleHandler - nextCandidate", {
                        guild: this.textChannel.guild.id,
                        nextKey: nextS ?? null,
                        songsSize: this.songs.size,
                    });

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
                                        `⏹️ **|** ${__mf("utils.generalHandler.stopPlaying", {
                                            song: `**[${song.song.title}](${song.song.url})**`,
                                        })}`,
                                    ).setThumbnail(
                                        typeof song.song.thumbnail === "string" &&
                                            /^https?:\/\//i.test(song.song.thumbnail)
                                            ? song.song.thumbnail
                                            : null,
                                    ),
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
                        this.client.logger.debug("[ServerQueue] IdleHandler - play() threw", {
                            guild: this.textChannel.guild.id,
                            nextKey: nextS ?? null,
                            error:
                                error instanceof Error
                                    ? (error.stack ?? error.message)
                                    : String(error),
                        });
                        if (!isRequestChannel) {
                            try {
                                await this.textChannel.send({
                                    embeds: [
                                        createEmbed(
                                            "error",
                                            __mf("utils.generalHandler.errorPlaying", {
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

                        this.client.logger.error("PLAY_ERR:", error);

                        const fallback = this.songs.first()?.key;
                        if (fallback && fallback !== nextS) {
                            try {
                                this.client.logger.info(
                                    `[ServerQueue] Attempting fallback play for ${this.textChannel.guild.name}: ${fallback}`,
                                );
                                await play(this.textChannel.guild, fallback);
                                return;
                            } catch (retryErr) {
                                this.client.logger.error("PLAY_ERR_RETRY:", retryErr);
                            }
                        }

                        try {
                            await play(this.textChannel.guild);
                        } catch (finalErr) {
                            this.client.logger.error("PLAY_ERR_FINAL:", finalErr);
                            this.connection?.disconnect();
                        }
                    }
                }
            })
            .on("error", (err) => {
                if (this._suppressPlayerErrors) {
                    this.client.logger.debug(
                        "[ServerQueue] Suppressed player error during shutdown:",
                        err instanceof Error ? (err.stack ?? err.message) : err,
                    );
                    return;
                }

                const __mf = i18n__mf(this.client, this.textChannel.guild);
                (async () => {
                    const isRequestChannel = this.client.requestChannelManager.isRequestChannel(
                        this.textChannel.guild,
                        this.textChannel.id,
                    );

                    const messageText = __mf("utils.generalHandler.errorPlaying", {
                        message: `\`${(err as Error)?.message ?? String(err)}\``,
                    });

                    const errorMsg = await this.textChannel
                        .send({
                            embeds: [createEmbed("error", messageText, true)],
                        })
                        .catch((error: unknown) => {
                            this.client.logger.error(
                                "PLAY_CMD_ERR:",
                                error instanceof Error ? (error.stack ?? error) : error,
                            );
                            return null;
                        });

                    if (isRequestChannel && errorMsg) {
                        setTimeout(() => {
                            errorMsg.delete().catch(() => null);
                        }, 60_000);
                    }
                })();
                this.client.logger.error(
                    "PLAY_ERR:",
                    err instanceof Error ? (err.stack ?? err) : err,
                );
            })
            .on("debug", (message) => {
                this.client.logger.debug(message);
            });
    }

    private loadSavedState(): void {
        const botId = this.client.user?.id ?? "unknown";
        const guildId = this.textChannel.guild.id;

        if (
            "getPlayerState" in this.client.data &&
            typeof this.client.data.getPlayerState === "function"
        ) {
            let savedState: {
                loopMode?: string;
                shuffle?: boolean;
                volume?: number;
                filters?: Record<string, boolean>;
            } | null = null;

            if (this.client.config.isMultiBot) {
                const botInstance = this.client.multiBotManager.getBotByClient(this.client);
                const isPrimary = botInstance?.isPrimary ?? true;

                this.client.logger.info(
                    `[MultiBot] ${this.client.user?.tag} attempting to load player state for guild ${guildId} (${this.textChannel.guild.name}), botId=${botId}, isPrimary=${isPrimary}`,
                );

                savedState = (this.client.data as any).getPlayerState(guildId, botId);

                if (savedState) {
                    this.client.logger.debug(
                        `[MultiBot] ${this.client.user?.tag} loaded own player state`,
                    );
                } else if (!isPrimary) {
                    const primaryBot = this.client.multiBotManager.getPrimaryBot();
                    const primaryBotId = primaryBot?.user?.id;

                    if (primaryBotId) {
                        savedState = (this.client.data as any).getPlayerState(
                            guildId,
                            primaryBotId,
                        );
                        if (savedState) {
                            this.client.logger.info(
                                `[MultiBot] ${this.client.user?.tag} (non-primary) no own state found, inheriting from PRIMARY bot (${primaryBot?.user?.tag})`,
                            );
                        }
                    }
                }
            } else {
                savedState = (this.client.data as any).getPlayerState(guildId, botId);
                this.client.logger.debug(
                    `Loading player state from SQLite for guild ${guildId} (${this.textChannel.guild.name}), botId=${botId}`,
                );
            }

            if (savedState) {
                this.loopMode = (savedState.loopMode as typeof this.loopMode) ?? "OFF";
                this.shuffle = savedState.shuffle ?? false;
                this._volume = savedState.volume ?? 100;
                this.filters = (savedState.filters ?? {}) as Partial<
                    Record<keyof typeof filterArgs, boolean>
                >;
                this.client.logger.info(
                    `✅ Loaded saved player state for guild ${this.textChannel.guild.name}: ` +
                        `loop=${this.loopMode}, shuffle=${this.shuffle}, volume=${this._volume}, filters=${JSON.stringify(this.filters)}`,
                );
            } else {
                this.client.logger.warn(
                    `⚠️ No saved player state found for guild ${this.textChannel.guild.name}, using defaults`,
                );
            }
            return;
        }

        const savedState = this.client.data.data?.[guildId]?.playerState;
        if (savedState) {
            this.loopMode = savedState.loopMode ?? "OFF";
            this.shuffle = savedState.shuffle ?? false;
            this._volume = savedState.volume ?? 100;
            this.filters = (savedState.filters ?? {}) as Partial<
                Record<keyof typeof filterArgs, boolean>
            >;
            this.client.logger.info(
                `✅ Loaded saved player state for guild ${this.textChannel.guild.name}: ` +
                    `loop=${this.loopMode}, shuffle=${this.shuffle}, volume=${this._volume}, filters=${JSON.stringify(this.filters)}`,
            );
        } else {
            this.client.logger.warn(
                `⚠️ No saved player state found for guild ${this.textChannel.guild.name}, using defaults`,
            );
        }
    }

    public async saveState(): Promise<void> {
        const playerState = {
            loopMode: this.loopMode,
            shuffle: this.shuffle,
            volume: this._volume,
            filters: this.filters as Record<string, boolean>,
        };

        const botId = this.client.user?.id ?? "unknown";
        const guildId = this.textChannel.guild.id;

        if (
            "savePlayerState" in this.client.data &&
            typeof this.client.data.savePlayerState === "function"
        ) {
            this.client.logger.debug(
                `Saving player state to SQLite for guild ${guildId} (${this.textChannel.guild.name}), botId=${botId}: ` +
                    `loop=${this.loopMode}, shuffle=${this.shuffle}, volume=${this._volume}, filters=${JSON.stringify(playerState.filters)}`,
            );

            try {
                await (this.client.data as any).savePlayerState(guildId, botId, playerState);
                this.client.logger.info(
                    `✅ Saved player state to SQLite for guild ${this.textChannel.guild.name}`,
                );
            } catch (error) {
                this.client.logger.error(`❌ Failed to save player state to SQLite:`, error);
            }
            return;
        }

        const currentData = this.client.data.data ?? {};
        const guildData = currentData[guildId] ?? {};

        guildData.playerState = playerState;

        await this.client.data.save(() => ({
            ...currentData,
            [guildId]: guildData,
        }));
    }

    public copyStateFrom(sourceQueue: ServerQueue): void {
        this.loopMode = sourceQueue.loopMode;
        this.shuffle = sourceQueue.shuffle;
        this._volume = sourceQueue.volume;
        this.filters = { ...sourceQueue.filters };
        this.client.logger.info(
            `[MultiBot] Copied player state from primary bot: loop=${this.loopMode}, shuffle=${this.shuffle}, volume=${this._volume}`,
        );
    }

    public async saveQueueState(): Promise<void> {
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

        const queueState = {
            textChannelId: this.textChannel.id,
            voiceChannelId,
            songs: savedSongs,
            currentSongKey,
            currentPosition,
        };

        if (
            "saveQueueState" in this.client.data &&
            typeof this.client.data.saveQueueState === "function"
        ) {
            const botId = this.client.user?.id ?? "unknown";
            await (this.client.data as any).saveQueueState(
                this.textChannel.guild.id,
                botId,
                queueState,
            );
        } else {
            const currentData = this.client.data.data ?? {};
            const guildData = currentData[this.textChannel.guild.id] ?? {};
            guildData.queueState = queueState;

            await this.client.data.save(() => ({
                ...currentData,
                [this.textChannel.guild.id]: guildData,
            }));
        }
    }

    public async clearQueueState(): Promise<void> {
        if (
            "deleteQueueState" in this.client.data &&
            typeof this.client.data.deleteQueueState === "function"
        ) {
            const botId = this.client.user?.id ?? "unknown";
            await (this.client.data as any).deleteQueueState(this.textChannel.guild.id, botId);
        } else {
            const currentData = this.client.data.data ?? {};
            const guildData = currentData[this.textChannel.guild.id] ?? {};

            delete guildData.queueState;

            await this.client.data.save(() => ({
                ...currentData,
                [this.textChannel.guild.id]: guildData,
            }));
        }
    }

    public async clearPlayerState(): Promise<void> {
        const botId = this.client.user?.id ?? "unknown";
        const guildId = this.textChannel.guild.id;

        if (
            "deletePlayerState" in this.client.data &&
            typeof this.client.data.deletePlayerState === "function"
        ) {
            await (this.client.data as any).deletePlayerState(guildId, botId);
            this.client.logger.info(
                `✅ Cleared player state for guild ${this.textChannel.guild.name}`,
            );
            return;
        }

        const currentData = this.client.data.data ?? {};
        const guildData = currentData[guildId] ?? {};

        delete guildData.playerState;

        await this.client.data.save(() => ({
            ...currentData,
            [guildId]: guildData,
        }));
        this.client.logger.info(`✅ Cleared player state for guild ${this.textChannel.guild.name}`);
    }

    public setFilter(filter: keyof typeof filterArgs, state: boolean): boolean {
        const before = this.filters[filter];
        this.filters[filter] = state;

        void this.saveState();

        if (before !== state && this.player.state.status === AudioPlayerStatus.Playing) {
            const resource = (this.player.state as AudioPlayerPlayingState).resource;
            const currentSong = (resource as AudioResource<QueueSong>).metadata;
            const songUrl = currentSong.song.url;
            const isLive = currentSong.song.isLive ?? false;

            if (isLive || !enableAudioCache) {
                this.seekOffset = 0;
                this.playing = false;
                void play(this.textChannel.guild, currentSong.key, true, 0);
                return false;
            }

            const isCached = this.client.audioCache.isCached(songUrl);
            const isInProgress = this.client.audioCache.isInProgress(songUrl);

            if (isCached && !isInProgress) {
                const currentPosition =
                    Math.floor((resource.playbackDuration ?? 0) / 1000) + this.seekOffset;

                this.seekOffset = currentPosition;
                this.playing = false;
                void play(this.textChannel.guild, currentSong.key, true, currentPosition);
                return true;
            }

            this.client.logger.info(
                `[ServerQueue] Filter "${filter}" set to ${state}, restarting song from beginning (not fully cached).`,
            );
            this.seekOffset = 0;
            this.playing = false;
            void play(this.textChannel.guild, currentSong.key, true, 0);
            return false;
        }

        return true;
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
        // Record pending cache URLs so they can be cleared when the bot actually
        // disconnects from the voice channel. Do NOT clear cache here.
        try {
            const songUrls: string[] = this.songs.map((s) => s.song.url);
            try {
                const playingResource = (this.player.state as AudioPlayerPlayingState | any)
                    .resource as import("@discordjs/voice").AudioResource | undefined;
                const metadata = playingResource?.metadata as QueueSong | undefined;
                const currentUrl = metadata?.song?.url ?? (metadata as any)?.url ?? null;
                if (currentUrl && !songUrls.includes(currentUrl)) {
                    songUrls.push(currentUrl);
                }
            } catch {
                // ignore
            }

            this._pendingCacheUrls = songUrls;
        } catch {
            // ignore
        }

        this.songs.clear();
        this._suppressPlayerErrors = true;
        setTimeout(() => {
            this._suppressPlayerErrors = false;
        }, 2_000);
        this.player.stop(true);
    }

    public destroy(): void {
        let songUrls = this.songs.map((song) => song.song.url);
        if (
            (songUrls.length === 0 || songUrls.every((s) => !s)) &&
            this._pendingCacheUrls.length > 0
        ) {
            songUrls = [...this._pendingCacheUrls];
        }
        this._suppressPlayerErrors = true;
        this.stop();
        this.connection?.disconnect();
        clearTimeout(this.timeout ?? undefined);
        void this.clearQueueState();

        if (this.client.config.isMultiBot) {
            const botInstance = this.client.multiBotManager.getBotByClient(this.client);
            if (botInstance && !botInstance.isPrimary) {
                void this.clearPlayerState();
                this.client.logger.info(
                    `[MultiBot] ${this.client.user?.tag} (non-primary) cleared player state on destroy`,
                );
            } else {
                this.client.logger.info(
                    `[MultiBot] ${this.client.user?.tag} (primary) preserving player state on destroy`,
                );
            }
        }

        delete this.textChannel.guild.queue;
        if (songUrls.length > 0) {
            this.client.audioCache.clearCacheForUrls(songUrls);
            this._pendingCacheUrls.length = 0;
        }
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
                    .catch((error: unknown) => {
                        const discordError = error as { code?: number };
                        if (discordError.code !== 10008) {
                            this.textChannel.client.logger.error(
                                "DELETE_LAST_MUSIC_MESSAGE_ERR:",
                                error,
                            );
                        }
                    });
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
                    .catch((error: unknown) => {
                        const discordError = error as { code?: number };
                        if (discordError.code !== 10008) {
                            this.textChannel.client.logger.error(
                                "DELETE_LAST_VS_UPDATE_MESSAGE_ERR:",
                                error,
                            );
                        }
                    });
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
        const __mf = i18n__mf(this.client, this.textChannel.guild);
        this.client.logger.info(
            `${this.client.shard ? `[Shard #${this.client.shard.ids[0]}]` : ""} Track: "${newSong.title}" on ${
                this.textChannel.guild.name
            } has started.`,
        );
        (async () => {
            const thumb =
                typeof newSong.thumbnail === "string" && /^https?:\/\//i.test(newSong.thumbnail)
                    ? newSong.thumbnail
                    : null;
            await this.textChannel
                .send({
                    embeds: [
                        createEmbed(
                            "info",
                            `▶️ **|** ${__mf("utils.generalHandler.startPlaying", {
                                song: `**[${newSong.title}](${newSong.url})**`,
                            })}`,
                        ).setThumbnail(thumb),
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
