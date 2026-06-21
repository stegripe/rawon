import { clearInterval, clearTimeout, setInterval, setTimeout } from "node:timers";
import {
    type AudioPlayer,
    type AudioPlayerPlayingState,
    AudioPlayerStatus,
    type AudioResource,
    createAudioPlayer,
    type VoiceConnection,
} from "@discordjs/voice";
import {
    ChannelType,
    Events,
    MessageFlags,
    type Snowflake,
    type StageChannel,
    type TextChannel,
    type VoiceChannel,
} from "discord.js";
import { type LoopMode, type QueueSong, type SavedQueueSong, type Song } from "../typings/index.js";
import { createEmbed } from "../utils/functions/createEmbed.js";
import { type filterArgs } from "../utils/functions/ffmpegArgs.js";
import { formatBoldPrefixedCommand } from "../utils/functions/formatCodeSpan.js";
import { formatBoldMarkdownLink } from "../utils/functions/formatMarkdown.js";
import { getEffectivePrefix } from "../utils/functions/getEffectivePrefix.js";
import { i18n__mf } from "../utils/functions/i18n.js";
import { checkQuery, play } from "../utils/handlers/GeneralUtil.js";
import { SongManager } from "../utils/structures/SongManager.js";
import { BOT_SETTINGS_DEFAULTS } from "../utils/structures/SQLiteDataManager.js";
import {
    type FallbackDataManager,
    hasDeletePlayerState,
    hasDeleteQueueState,
    hasDeleteVoiceChannelStatusState,
    hasGetPlayerState,
    hasGetVoiceChannelStatusState,
    hasGetVoiceChannelStatusStatesByChannel,
    hasSavePlayerState,
    hasSaveQueueState,
    hasSaveVoiceChannelStatusState,
} from "../utils/typeGuards.js";
import { type Rawon } from "./Rawon.js";

const nonEnum = { enumerable: false };

export type RequesterDeafTimeoutReason = "deaf" | "left";

type RequesterDeafTimeoutState = {
    requesterId: Snowflake;
    songKey: Snowflake;
    reason: RequesterDeafTimeoutReason;
    timeout: NodeJS.Timeout;
};

export type ServerQueueTextChannel = TextChannel | VoiceChannel | StageChannel;

type VoiceChannelStatusState = {
    channelId: Snowflake;
    originalStatus: string | null;
    appliedStatus: string;
};

type OwnedVoiceChannelStatusState = VoiceChannelStatusState & {
    botId: string;
};

type ChannelInfoPayload = {
    guild_id?: Snowflake;
    channels?: {
        id: Snowflake;
        status?: string | null;
    }[];
};

const AUTOPLAY_HISTORY_LIMIT = 30;

export class ServerQueue {
    public readonly player: AudioPlayer = createAudioPlayer();
    public connection: VoiceConnection | null = null;
    public queueEndedNotified = false;
    public timeout: NodeJS.Timeout | null = null;
    public readonly songs: SongManager;
    public loopMode: LoopMode = "OFF";
    public shuffle = false;
    public autoPlay = false;
    public filters: Partial<Record<keyof typeof filterArgs, boolean>> = {};
    public seekOffset = 0;

    private _volume = BOT_SETTINGS_DEFAULTS.defaultVolume;
    private _lastVSUpdateMsg: Snowflake | null = null;
    private _lastMusicMsg: Snowflake | null = null;
    private _skipVoters: Snowflake[] = [];
    private _skipInProgress = false;
    private _lastSkipTime = 0;
    private _skipCooldownMs = 2000;
    private _positionSaveInterval: NodeJS.Timeout | null = null;
    private _suppressPlayerErrors = false;
    private _pendingCacheUrls: string[] = [];
    private _shuffleUpcomingKeys: Snowflake[] = [];
    private _prefetchedAutoplaySong: { fromSongKey: Snowflake; song: Song } | null = null;
    private _autoplayPrefetchPromise: Promise<void> | null = null;
    private _autoplayPrefetchForKey: Snowflake | null = null;
    private _autoplayHistory: Song[] = [];
    private _requesterDeafTimeout: RequesterDeafTimeoutState | null = null;
    private _voiceChannelStatusState: VoiceChannelStatusState | null = null;
    private _voiceChannelStatusRestorePromise: Promise<void> | null = null;

    public constructor(public readonly textChannel: ServerQueueTextChannel) {
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
            _prefetchedAutoplaySong: nonEnum,
            _autoplayPrefetchPromise: nonEnum,
            _autoplayPrefetchForKey: nonEnum,
            _autoplayHistory: nonEnum,
            _requesterDeafTimeout: nonEnum,
            _voiceChannelStatusState: nonEnum,
            _voiceChannelStatusRestorePromise: nonEnum,
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
                    this.clearRequesterDeafTimeout();
                    this.endSkip();
                    newState.resource.volume?.setVolumeLogarithmic(this.volume / 100);

                    const currentSong = (this.player.state as AudioPlayerPlayingState).resource
                        .metadata as QueueSong;
                    const newSong = currentSong.song;

                    void this.setNowPlayingVoiceChannelStatus(newSong.title);

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
                    } catch {}
                    try {
                        const upcoming = this.songs.sortByIndex().map((s) => s.key);
                        this.client.logger.debug("[ServerQueue] IdleHandler - queueState", {
                            guild: this.textChannel.guild.id,
                            songsSize: this.songs.size,
                            loopMode: this.loopMode,
                            shuffle: this.shuffle,
                            autoPlay: this.autoPlay,
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
                        nextS = this.getNextShuffleKey(song.key);
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

                    const me = this.textChannel.guild.members.me;
                    if (!nextS && this.autoPlay && me) {
                        const autoPlaySong =
                            (await this.consumePrefetchedAutoplaySong(song)) ??
                            (await this.resolveAutoplaySong(song));

                        if (autoPlaySong !== undefined) {
                            nextS = this.songs.addSong(autoPlaySong, me);
                            this.recordAutoplayHistory(autoPlaySong);
                            this.client.logger.info(
                                `[ServerQueue] Auto-play queued for ${this.textChannel.guild.name}: ${autoPlaySong.title}`,
                            );
                        }
                    }

                    if (this._prefetchedAutoplaySong?.fromSongKey === song.key) {
                        this._prefetchedAutoplaySong = null;
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
                                flags: MessageFlags.SuppressNotifications,
                                embeds: [
                                    createEmbed(
                                        "info",
                                        `⏹️ **|** ${__mf("utils.generalHandler.stopPlaying", {
                                            song: formatBoldMarkdownLink(
                                                song.song.title,
                                                song.song.url,
                                            ),
                                        })}`,
                                    ).setThumbnail(
                                        typeof song.song.thumbnail === "string" &&
                                            /^https?:\/\//u.test(song.song.thumbnail)
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
                                    flags: MessageFlags.SuppressNotifications,
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
                if (err && (err as Error).name === "AbortError") {
                    this.client.logger.debug("Playback aborted:", (err as Error).message);
                    return;
                }

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
                            flags: MessageFlags.SuppressNotifications,
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

        if (hasGetPlayerState(this.client.data)) {
            let savedState: {
                loopMode?: string;
                shuffle?: boolean;
                autoplay?: boolean;
                volume?: number;
                filters?: Record<string, boolean>;
            } | null = null;

            if (this.client.config.isMultiBot) {
                const botInstance = this.client.multiBotManager.getBotByClient(this.client);
                const isPrimary = botInstance?.isPrimary ?? true;

                this.client.logger.debug(
                    `[MultiBot] ${this.client.user?.tag} attempting to load player state for guild ${guildId} (${this.textChannel.guild.name}), botId=${botId}, isPrimary=${isPrimary}`,
                );

                savedState = this.client.data.getPlayerState(guildId, botId) ?? null;

                if (savedState) {
                    this.client.logger.debug(
                        `[MultiBot] ${this.client.user?.tag} loaded own player state`,
                    );
                } else if (!isPrimary) {
                    const primaryBot = this.client.multiBotManager.getPrimaryBot();
                    const primaryBotId = primaryBot?.user?.id;

                    if (primaryBotId) {
                        savedState = this.client.data.getPlayerState(guildId, primaryBotId) ?? null;
                        if (savedState) {
                            this.client.logger.debug(
                                `[MultiBot] ${this.client.user?.tag} (non-primary) no own state found, inheriting from PRIMARY bot (${primaryBot?.user?.tag})`,
                            );
                        }
                    }
                }
            } else {
                savedState = this.client.data.getPlayerState(guildId, botId) ?? null;
                this.client.logger.debug(
                    `Loading player state from SQLite for guild ${guildId} (${this.textChannel.guild.name}), botId=${botId}`,
                );
            }

            if (savedState) {
                this.loopMode = (savedState.loopMode as typeof this.loopMode) ?? "OFF";
                this.shuffle = savedState.shuffle ?? false;
                this.autoPlay = savedState.autoplay ?? false;
                this._volume = savedState.volume ?? this.resolvedDefaultVolume;
                this.filters = (savedState.filters ?? {}) as Partial<
                    Record<keyof typeof filterArgs, boolean>
                >;
                this.client.logger.debug(
                    `✅ Loaded saved player state for guild ${this.textChannel.guild.name}: ` +
                        `loop=${this.loopMode}, shuffle=${this.shuffle}, autoPlay=${this.autoPlay}, volume=${this._volume}, filters=${JSON.stringify(this.filters)}`,
                );
            } else {
                this.client.logger.debug(
                    `⚠️ No saved player state found for guild ${this.textChannel.guild.name}, using defaults`,
                );
            }
            return;
        }

        const fallback = this.client.data as FallbackDataManager;
        const savedState = fallback.data?.[guildId]?.playerState;
        if (savedState) {
            this.loopMode = savedState.loopMode ?? "OFF";
            this.shuffle = savedState.shuffle ?? false;
            this.autoPlay = savedState.autoplay ?? false;
            this._volume = savedState.volume ?? this.resolvedDefaultVolume;
            this.filters = (savedState.filters ?? {}) as Partial<
                Record<keyof typeof filterArgs, boolean>
            >;
            this.client.logger.debug(
                `✅ Loaded saved player state for guild ${this.textChannel.guild.name}: ` +
                    `loop=${this.loopMode}, shuffle=${this.shuffle}, autoPlay=${this.autoPlay}, volume=${this._volume}, filters=${JSON.stringify(this.filters)}`,
            );
        } else {
            this.client.logger.debug(
                `⚠️ No saved player state found for guild ${this.textChannel.guild.name}, using defaults`,
            );
        }
    }

    public async saveState(): Promise<void> {
        const playerState = {
            loopMode: this.loopMode,
            shuffle: this.shuffle,
            autoplay: this.autoPlay,
            volume: this._volume,
            filters: this.filters as Record<string, boolean>,
        };

        const botId = this.client.user?.id ?? "unknown";
        const guildId = this.textChannel.guild.id;

        if (hasSavePlayerState(this.client.data)) {
            this.client.logger.debug(
                `Saving player state to SQLite for guild ${guildId} (${this.textChannel.guild.name}), botId=${botId}: ` +
                    `loop=${this.loopMode}, shuffle=${this.shuffle}, autoPlay=${this.autoPlay}, volume=${this._volume}, filters=${JSON.stringify(playerState.filters)}`,
            );

            try {
                await this.client.data.savePlayerState(guildId, botId, playerState);
                this.client.logger.info(
                    `✅ Saved player state to SQLite for guild ${this.textChannel.guild.name}`,
                );
            } catch (error) {
                this.client.logger.error(`❌ Failed to save player state to SQLite:`, error);
            }
            return;
        }

        const fallback = this.client.data as FallbackDataManager;
        const currentData = fallback.data ?? {};
        const guildData = currentData[guildId] ?? {};

        guildData.playerState = playerState;

        (await fallback.save?.(() => ({
            ...currentData,
            [guildId]: guildData,
        }))) ?? Promise.resolve();
    }

    public copyStateFrom(sourceQueue: ServerQueue): void {
        this.loopMode = sourceQueue.loopMode;
        this.shuffle = sourceQueue.shuffle;
        this.autoPlay = sourceQueue.autoPlay;
        this._volume = sourceQueue.volume;
        this.filters = { ...sourceQueue.filters };
        this.client.logger.info(
            `[MultiBot] Copied player state from primary bot: loop=${this.loopMode}, shuffle=${this.shuffle}, autoPlay=${this.autoPlay}, volume=${this._volume}`,
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

        const botId = this.client.user?.id ?? "unknown";
        const savedSongs: SavedQueueSong[] = this.songs
            .sortByIndex()
            .filter((queueSong) => queueSong.requester.id !== botId)
            .map((queueSong) => ({
                requesterId: queueSong.requester.id,
                index: queueSong.index,
                song: queueSong.song,
                key: queueSong.key,
            }));

        if (currentSongKey !== null && !savedSongs.some((song) => song.key === currentSongKey)) {
            currentSongKey = null;
            currentPosition = 0;
        }

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

        if (hasSaveQueueState(this.client.data)) {
            await this.client.data.saveQueueState(this.textChannel.guild.id, botId, queueState);
        } else {
            const fallback = this.client.data as FallbackDataManager;
            const currentData = fallback.data ?? {};
            const guildData = currentData[this.textChannel.guild.id] ?? {};
            guildData.queueState = queueState;

            (await fallback.save?.(() => ({
                ...currentData,
                [this.textChannel.guild.id]: guildData,
            }))) ?? Promise.resolve();
        }
    }

    public async clearQueueState(): Promise<void> {
        if (hasDeleteQueueState(this.client.data)) {
            const botId = this.client.user?.id ?? "unknown";
            await this.client.data.deleteQueueState(this.textChannel.guild.id, botId);
        } else {
            const fallback = this.client.data as FallbackDataManager;
            const currentData = fallback.data ?? {};
            const guildData = currentData[this.textChannel.guild.id] ?? {};

            delete guildData.queueState;

            (await fallback.save?.(() => ({
                ...currentData,
                [this.textChannel.guild.id]: guildData,
            }))) ?? Promise.resolve();
        }
    }

    public async clearPlayerState(): Promise<void> {
        const botId = this.client.user?.id ?? "unknown";
        const guildId = this.textChannel.guild.id;

        if (hasDeletePlayerState(this.client.data)) {
            await this.client.data.deletePlayerState(guildId, botId);
            this.client.logger.info(
                `✅ Cleared player state for guild ${this.textChannel.guild.name}`,
            );
            return;
        }

        const fallback = this.client.data as FallbackDataManager;
        const currentData = fallback.data ?? {};
        const guildData = currentData[guildId] ?? {};

        delete guildData.playerState;

        (await fallback.save?.(() => ({
            ...currentData,
            [guildId]: guildData,
        }))) ?? Promise.resolve();
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

            if (isLive || !this.resolvedEnableAudioCache) {
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
        if (value) {
            this.syncShuffleUpcomingKeys();
        } else {
            this._shuffleUpcomingKeys = [];
        }
        void this.saveState();
    }

    public setAutoPlay(value: boolean): void {
        this.autoPlay = value;
        if (!value) {
            this.clearAutoplayPrefetchState();
        } else if (this.player.state.status === AudioPlayerStatus.Playing) {
            const currentSong = (this.player.state as AudioPlayerPlayingState).resource
                .metadata as QueueSong;
            this.preCacheNextSong(currentSong);
        }
        void this.saveState();
    }

    public setAutoplay(value: boolean): void {
        this.setAutoPlay(value);
    }

    public stop(): void {
        this.stopPositionSaveInterval();
        this.clearRequesterDeafTimeout();
        void this.restoreVoiceChannelStatus();
        try {
            const songUrls: string[] = this.songs.map((s) => s.song.url);
            try {
                const playingResource = (this.player.state as AudioPlayerPlayingState | any)
                    .resource as import("@discordjs/voice").AudioResource | undefined;
                const metadata = playingResource?.metadata as QueueSong | undefined;
                const meta = metadata as { song?: { url?: string }; url?: string } | undefined;
                const currentUrl = meta?.song?.url ?? meta?.url ?? null;
                if (currentUrl && !songUrls.includes(currentUrl)) {
                    songUrls.push(currentUrl);
                }
            } catch {}

            this._pendingCacheUrls = songUrls;
        } catch {}

        this.songs.clear();
        this.clearAutoplayPrefetchState();
        this._suppressPlayerErrors = true;
        setTimeout(() => {
            this._suppressPlayerErrors = false;
        }, 2_000);
        this.player.stop(true);
    }

    public async destroy(): Promise<void> {
        let songUrls = this.songs.map((song) => song.song.url);
        if (
            (songUrls.length === 0 || songUrls.every((s) => !s)) &&
            this._pendingCacheUrls.length > 0
        ) {
            songUrls = [...this._pendingCacheUrls];
        }
        this._suppressPlayerErrors = true;
        this.stop();
        await this.restoreVoiceChannelStatus();

        try {
            this.connection?.disconnect();
        } catch {}

        const start = Date.now();
        const timeoutMs = 5_000;
        while (Date.now() - start < timeoutMs) {
            try {
                const guildMe = this.textChannel.guild.members.me;
                if (!guildMe?.voice?.channelId) {
                    break;
                }
            } catch {
                break;
            }
            await new Promise((r) => setTimeout(r, 100));
        }

        clearTimeout(this.timeout ?? undefined);
        await this.clearQueueState();

        if (this.client.config.isMultiBot) {
            const botInstance = this.client.multiBotManager.getBotByClient(this.client);
            if (botInstance && !botInstance.isPrimary) {
                await this.clearPlayerState();
                await this.client.requestChannelManager.deletePlayerMessage(this.textChannel.guild);
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

        try {
            const isRequestChannel = this.client.requestChannelManager.isRequestChannel(
                this.textChannel.guild,
                this.textChannel.id,
            );
            if (!isRequestChannel && !this.queueEndedNotified) {
                const __mf = i18n__mf(this.client, this.textChannel.guild);
                const msg = await this.textChannel
                    .send({
                        flags: MessageFlags.SuppressNotifications,
                        embeds: [
                            createEmbed(
                                "info",
                                `⏹️ **|** ${__mf("utils.generalHandler.queueEnded", {
                                    usage: formatBoldPrefixedCommand(
                                        getEffectivePrefix(
                                            this.client,
                                            this.textChannel.guild?.id ?? null,
                                        ),
                                        "play",
                                    ),
                                })}`,
                            ),
                        ],
                    })
                    .catch(() => null);
                if (msg) {
                    this.lastMusicMsg = msg.id;
                }
            }
        } catch (e) {
            this.client.logger.debug("DESTROY_MSG_ERR:", e);
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
        const resource = (
            this.player.state as AudioPlayerPlayingState & { resource: AudioResource | undefined }
        ).resource;
        resource?.volume?.setVolumeLogarithmic(this._volume / 100);
        void this.saveState();
    }

    public get skipVoters(): Snowflake[] {
        return this._skipVoters;
    }

    public set skipVoters(value: Snowflake[]) {
        this._skipVoters = value;
    }

    public get requesterDeafTimeout(): RequesterDeafTimeoutState | null {
        return this._requesterDeafTimeout;
    }

    public setRequesterDeafTimeout(value: RequesterDeafTimeoutState): void {
        this.clearRequesterDeafTimeout();
        this._requesterDeafTimeout = value;
    }

    public clearRequesterDeafTimeout(): void {
        if (this._requesterDeafTimeout !== null) {
            clearTimeout(this._requesterDeafTimeout.timeout);
            this._requesterDeafTimeout = null;
        }
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
            if (this.requesterDeafTimeout) {
                return;
            }
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

    private get resolvedDefaultVolume(): number {
        return this.client.data.botSettings.defaultVolume;
    }

    private get resolvedEnableAudioCache(): boolean {
        return this.client.data.botSettings.enableAudioCache;
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
                    flags: MessageFlags.SuppressNotifications,
                    embeds: [
                        createEmbed(
                            "info",
                            `▶️ **|** ${__mf("utils.generalHandler.startPlaying", {
                                song: formatBoldMarkdownLink(newSong.title, newSong.url),
                            })}`,
                        ).setThumbnail(thumb),
                    ],
                })
                .then((ms) => (this.lastMusicMsg = ms.id))
                .catch((error: unknown) => this.client.logger.error("PLAY_ERR:", error));
        })();
    }

    private getConnectedVoiceChannel(): VoiceChannel | null {
        const voiceChannelId = this.connection?.joinConfig.channelId;
        if (!voiceChannelId) {
            return null;
        }

        const channel = this.textChannel.guild.channels.cache.get(voiceChannelId);
        return channel?.type === ChannelType.GuildVoice ? channel : null;
    }

    private formatVoiceChannelMusicStatus(title: string): string {
        return Array.from(`🎵\u2007${title}`).slice(0, 500).join("");
    }

    private getBotId(): string {
        return this.client.user?.id ?? "unknown";
    }

    private getSavedVoiceChannelStatusState(): VoiceChannelStatusState | null {
        const guildId = this.textChannel.guild.id;
        const botId = this.getBotId();

        if (hasGetVoiceChannelStatusState(this.client.data)) {
            const state = this.client.data.getVoiceChannelStatusState(guildId, botId);
            return state ?? null;
        }

        const fallback = this.client.data as FallbackDataManager;
        return fallback.data?.[guildId]?.voiceChannelStatusState ?? null;
    }

    private getSavedVoiceChannelStatusStatesByChannel(
        channelId: Snowflake,
    ): OwnedVoiceChannelStatusState[] {
        const guildId = this.textChannel.guild.id;

        if (hasGetVoiceChannelStatusStatesByChannel(this.client.data)) {
            return this.client.data.getVoiceChannelStatusStatesByChannel(guildId, channelId);
        }

        const savedState = this.getSavedVoiceChannelStatusState();
        if (savedState?.channelId !== channelId) {
            return [];
        }

        return [{ ...savedState, botId: this.getBotId() }];
    }

    private findVoiceChannelStatusOwner(
        channelId: Snowflake,
        currentStatus: string | null | undefined,
    ): OwnedVoiceChannelStatusState | null {
        if (typeof currentStatus !== "string") {
            return null;
        }

        return (
            this.getSavedVoiceChannelStatusStatesByChannel(channelId).find(
                (state) => state.appliedStatus === currentStatus,
            ) ?? null
        );
    }

    private async saveVoiceChannelStatusState(state: VoiceChannelStatusState): Promise<void> {
        const guildId = this.textChannel.guild.id;
        const botId = this.getBotId();

        if (hasSaveVoiceChannelStatusState(this.client.data)) {
            await this.client.data.saveVoiceChannelStatusState(guildId, botId, state);
            return;
        }

        const fallback = this.client.data as FallbackDataManager;
        const currentData = fallback.data ?? {};
        const guildData = currentData[guildId] ?? {};
        guildData.voiceChannelStatusState = state;

        (await fallback.save?.(() => ({
            ...currentData,
            [guildId]: guildData,
        }))) ?? Promise.resolve();
    }

    private async clearSavedVoiceChannelStatusState(): Promise<void> {
        const guildId = this.textChannel.guild.id;
        const botId = this.getBotId();

        if (hasDeleteVoiceChannelStatusState(this.client.data)) {
            await this.client.data.deleteVoiceChannelStatusState(guildId, botId);
            return;
        }

        const fallback = this.client.data as FallbackDataManager;
        const currentData = fallback.data ?? {};
        const guildData = currentData[guildId] ?? {};
        delete guildData.voiceChannelStatusState;

        (await fallback.save?.(() => ({
            ...currentData,
            [guildId]: guildData,
        }))) ?? Promise.resolve();
    }

    private async requestVoiceChannelStatus(
        channelId: Snowflake,
    ): Promise<string | null | undefined> {
        const guild = this.textChannel.guild;
        const shard = this.client.ws.shards.get(guild.shardId);
        if (!shard) {
            return undefined;
        }

        return new Promise((resolve) => {
            let settled = false;
            const timeout = setTimeout(() => {
                settle(undefined);
            }, 2_000);

            const settle = (status: string | null | undefined): void => {
                if (settled) {
                    return;
                }
                settled = true;
                clearTimeout(timeout);
                this.client.off(Events.Raw, onRaw);
                resolve(status);
            };

            const onRaw = (...args: unknown[]): void => {
                const packet = args[0] as { t?: string; d?: unknown };
                const shardId = args[1];
                if (shardId !== guild.shardId || packet.t !== "CHANNEL_INFO") {
                    return;
                }

                const payload = packet.d as ChannelInfoPayload;
                if (payload.guild_id !== guild.id) {
                    return;
                }

                const channelInfo = payload.channels?.find((channel) => channel.id === channelId);
                if (!channelInfo) {
                    return;
                }

                settle(typeof channelInfo.status === "string" ? channelInfo.status : null);
            };

            this.client.on(Events.Raw, onRaw);

            try {
                shard.send({
                    op: 43,
                    d: {
                        guild_id: guild.id,
                        fields: ["status"],
                    },
                });
            } catch (error) {
                this.client.logger.debug("VOICE_CHANNEL_STATUS_INFO_ERR:", error);
                settle(undefined);
            }
        });
    }

    private async setVoiceChannelStatus(
        channelId: Snowflake,
        status: string | null,
    ): Promise<void> {
        await this.client.rest.put(`/channels/${channelId}/voice-status`, {
            body: { status },
        });
    }

    private async setNowPlayingVoiceChannelStatus(title: string): Promise<void> {
        const voiceChannel = this.getConnectedVoiceChannel();
        if (!voiceChannel) {
            return;
        }

        const status = this.formatVoiceChannelMusicStatus(title);
        const currentState = this._voiceChannelStatusState;

        if (currentState && currentState.channelId !== voiceChannel.id) {
            await this.restoreVoiceChannelStatus();
        }

        try {
            const currentStatus = await this.requestVoiceChannelStatus(voiceChannel.id);
            const currentOwner = this.findVoiceChannelStatusOwner(voiceChannel.id, currentStatus);
            if (currentOwner && currentOwner.botId !== this.getBotId()) {
                this.client.logger.debug(
                    `[VoiceChannelStatus] Skipping status update for ${voiceChannel.id}; current status is owned by bot ${currentOwner.botId}`,
                );
                return;
            }

            if (!this._voiceChannelStatusState) {
                const savedState = this.getSavedVoiceChannelStatusState();
                const originalStatus =
                    savedState?.channelId === voiceChannel.id
                        ? savedState.originalStatus
                        : (currentStatus ?? null);
                await this.setVoiceChannelStatus(voiceChannel.id, status);
                this._voiceChannelStatusState = {
                    channelId: voiceChannel.id,
                    originalStatus,
                    appliedStatus: status,
                };
                await this.saveVoiceChannelStatusState(this._voiceChannelStatusState);
                return;
            }

            await this.setVoiceChannelStatus(voiceChannel.id, status);
            this._voiceChannelStatusState.appliedStatus = status;
            await this.saveVoiceChannelStatusState(this._voiceChannelStatusState);
        } catch (error) {
            this.client.logger.debug("VOICE_CHANNEL_STATUS_SET_ERR:", error);
        }
    }

    private restoreVoiceChannelStatus(): Promise<void> {
        if (this._voiceChannelStatusRestorePromise) {
            return this._voiceChannelStatusRestorePromise;
        }

        const state = this._voiceChannelStatusState;
        if (!state) {
            const savedState = this.getSavedVoiceChannelStatusState();
            if (!savedState) {
                return Promise.resolve();
            }

            this._voiceChannelStatusState = savedState;
            return this.restoreVoiceChannelStatus();
        }

        this._voiceChannelStatusState = null;

        const restorePromise = (async () => {
            try {
                const currentStatus = await this.requestVoiceChannelStatus(state.channelId);
                if (currentStatus === undefined) {
                    return;
                }

                if (currentStatus !== state.appliedStatus) {
                    await this.clearSavedVoiceChannelStatusState();
                    return;
                }

                await this.setVoiceChannelStatus(state.channelId, state.originalStatus);
                await this.clearSavedVoiceChannelStatusState();
            } catch (error) {
                this.client.logger.debug("VOICE_CHANNEL_STATUS_RESTORE_ERR:", error);
            }
        })().finally(() => {
            if (this._voiceChannelStatusRestorePromise === restorePromise) {
                this._voiceChannelStatusRestorePromise = null;
            }
        });

        this._voiceChannelStatusRestorePromise = restorePromise;
        return restorePromise;
    }

    private preCacheNextSong(currentSong: QueueSong): void {
        if (this.loopMode === "SONG") {
            return;
        }

        const songsToCache: string[] = [];
        const PRE_CACHE_AHEAD = 3;

        if (this.shuffle) {
            this.syncShuffleUpcomingKeys(currentSong.key);

            for (const key of this._shuffleUpcomingKeys.slice(0, PRE_CACHE_AHEAD)) {
                const nextSong = this.songs.get(key);
                if (!nextSong || nextSong.song.isLive) {
                    continue;
                }
                songsToCache.push(nextSong.song.url);
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

        if (!this.autoPlay || this.peekNextKey(currentSong) !== undefined) {
            return;
        }

        void this.preCacheAutoplaySong(currentSong);
    }

    private clearAutoplayPrefetchState(): void {
        this._prefetchedAutoplaySong = null;
        this._autoplayPrefetchForKey = null;
        this._autoplayPrefetchPromise = null;
        this._autoplayHistory = [];
    }

    private recordAutoplayHistory(song: Song): void {
        this._autoplayHistory.unshift(song);
        if (this._autoplayHistory.length > AUTOPLAY_HISTORY_LIMIT) {
            this._autoplayHistory.length = AUTOPLAY_HISTORY_LIMIT;
        }
    }

    private peekNextKey(currentSong: QueueSong): Snowflake | undefined {
        if (this.shuffle && this.loopMode !== "SONG") {
            this.syncShuffleUpcomingKeys(currentSong.key);
            return this._shuffleUpcomingKeys[0];
        }

        if (this.loopMode === "SONG") {
            if (this.songs.has(currentSong.key)) {
                return currentSong.key;
            }

            const sortedSongs = this.songs.sortByIndex();
            return (
                sortedSongs.filter((x) => x.index > currentSong.index).first()?.key ??
                sortedSongs.first()?.key
            );
        }

        const sortedSongs = this.songs.sortByIndex();
        return (
            sortedSongs.filter((x) => x.index > currentSong.index).first()?.key ??
            (this.loopMode === "QUEUE" ? sortedSongs.first()?.key : undefined)
        );
    }

    private async preCacheAutoplaySong(currentSong: QueueSong): Promise<void> {
        if (this._prefetchedAutoplaySong?.fromSongKey === currentSong.key) {
            return;
        }

        if (this._autoplayPrefetchForKey === currentSong.key && this._autoplayPrefetchPromise) {
            return;
        }

        this._autoplayPrefetchForKey = currentSong.key;
        const fromSongKey = currentSong.key;

        const task = (async () => {
            const autoPlaySong = await this.resolveAutoplaySong(currentSong);
            if (
                autoPlaySong === undefined ||
                !this.autoPlay ||
                this._autoplayPrefetchForKey !== fromSongKey
            ) {
                return;
            }

            this._prefetchedAutoplaySong = {
                fromSongKey,
                song: autoPlaySong,
            };

            if (!autoPlaySong.isLive) {
                await this.client.audioCache.preCacheUrl(autoPlaySong.url, true);
            }
        })();

        this._autoplayPrefetchPromise = task
            .catch((error: unknown) => {
                this.client.logger.debug("[ServerQueue] Auto-play pre-cache failed", {
                    guild: this.textChannel.guild.id,
                    songKey: currentSong.key,
                    error: error instanceof Error ? (error.stack ?? error.message) : String(error),
                });
            })
            .finally(() => {
                if (this._autoplayPrefetchForKey === fromSongKey) {
                    this._autoplayPrefetchForKey = null;
                }
                this._autoplayPrefetchPromise = null;
            });

        await this._autoplayPrefetchPromise;
    }

    private async consumePrefetchedAutoplaySong(currentSong: QueueSong): Promise<Song | undefined> {
        if (this._autoplayPrefetchForKey === currentSong.key && this._autoplayPrefetchPromise) {
            await Promise.race([
                this._autoplayPrefetchPromise,
                new Promise<void>((resolve) => {
                    setTimeout(resolve, 1500);
                }),
            ]);
        }

        if (this._prefetchedAutoplaySong?.fromSongKey !== currentSong.key) {
            return undefined;
        }

        const prefetchedSong = this._prefetchedAutoplaySong.song;
        this._prefetchedAutoplaySong = null;
        return prefetchedSong;
    }

    private syncShuffleUpcomingKeys(currentKey?: Snowflake): void {
        const candidateKeys = this.songs
            .filter((song) => song.key !== currentKey && !song.song.isLive)
            .map((song) => song.key);

        if (candidateKeys.length === 0) {
            this._shuffleUpcomingKeys = [];
            return;
        }

        const candidateSet = new Set(candidateKeys);
        const preserved = this._shuffleUpcomingKeys.filter((key) => candidateSet.has(key));
        const preservedSet = new Set(preserved);
        const missing = candidateKeys.filter((key) => !preservedSet.has(key));

        for (let i = missing.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [missing[i], missing[j]] = [missing[j], missing[i]];
        }

        this._shuffleUpcomingKeys = [...preserved, ...missing];
    }

    public getNextShuffleKey(currentKey: Snowflake): Snowflake | undefined {
        this.syncShuffleUpcomingKeys(currentKey);

        let nextKey = this._shuffleUpcomingKeys.shift();

        if (!nextKey && this.loopMode === "QUEUE") {
            this._shuffleUpcomingKeys = [];
            this.syncShuffleUpcomingKeys(currentKey);
            nextKey = this._shuffleUpcomingKeys.shift();
        }

        return nextKey;
    }

    private async resolveAutoplaySong(currentSong: QueueSong): Promise<Song | undefined> {
        const queryData = checkQuery(currentSong.song.url);

        try {
            const song = await this.client.license.autoplayMusic(
                currentSong.song,
                this._autoplayHistory,
                queryData.sourceType,
            );
            return song;
        } catch (error) {
            this.client.logger.debug("[ServerQueue] Auto-play resolve failed", {
                guild: this.textChannel.guild.id,
                source: queryData.sourceType ?? "auto",
                title: currentSong.song.title,
                error: error instanceof Error ? (error.stack ?? error.message) : String(error),
            });
        }

        return undefined;
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
