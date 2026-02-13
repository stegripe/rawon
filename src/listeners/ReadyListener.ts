import { setInterval } from "node:timers";
import { joinVoiceChannel } from "@discordjs/voice";
import { ApplyOptions } from "@sapphire/decorators";
import { Events, Listener, type ListenerOptions } from "@sapphire/framework";
import { ActivityType, ChannelType, type Presence } from "discord.js";
import { defaultVolume } from "../config/env.js";
import i18n from "../config/index.js";
import { type Rawon } from "../structures/Rawon.js";
import { ServerQueue } from "../structures/ServerQueue.js";
import {
    type EnvActivityTypes,
    type ExtendedDataManager,
    type GuildData,
} from "../typings/index.js";
import { createVoiceAdapter } from "../utils/functions/createVoiceAdapter.js";
import { type filterArgs } from "../utils/functions/ffmpegArgs.js";
import { formatMS } from "../utils/functions/formatMS.js";
import { play } from "../utils/handlers/GeneralUtil.js";

function hasExtendedMethods(data: unknown): data is ExtendedDataManager {
    return (
        typeof data === "object" &&
        data !== null &&
        "getAllGuildIds" in data &&
        typeof (data as ExtendedDataManager).getAllGuildIds === "function" &&
        "deleteRequestChannel" in data &&
        typeof (data as ExtendedDataManager).deleteRequestChannel === "function" &&
        "deletePlayerState" in data &&
        typeof (data as ExtendedDataManager).deletePlayerState === "function" &&
        "deleteQueueState" in data &&
        typeof (data as ExtendedDataManager).deleteQueueState === "function"
    );
}

function hasGetRequestChannel(
    data: unknown,
): data is { getRequestChannel: ExtendedDataManager["getRequestChannel"] } {
    return (
        typeof data === "object" &&
        data !== null &&
        "getRequestChannel" in data &&
        typeof (data as ExtendedDataManager).getRequestChannel === "function"
    );
}

@ApplyOptions<ListenerOptions>({
    event: Events.ClientReady,
    once: true,
})
export class ReadyListener extends Listener<typeof Events.ClientReady> {
    private currentClient!: Rawon;

    public async run(readyClient: typeof this.container.client): Promise<void> {
        const client = readyClient as Rawon;
        this.currentClient = client;

        if (client.application?.owner) {
            this.container.config.devs.push(client.application.owner.id);
        }

        await client.spotify.renew();

        const isPrimaryOrSingle =
            !this.container.config.isMultiBot || client.multiBotManager.getPrimaryBot() === client;
        if (isPrimaryOrSingle) {
            this.container.audioCache.clearCache();
            this.container.logger.info("[Startup] Cleared audio cache on bot restart");
        }

        if (this.container.config.isMultiBot) {
            const primaryBot = client.multiBotManager.getPrimaryBot();
            if (primaryBot && primaryBot !== client && primaryBot.user) {
                const primaryPresence = primaryBot.user.presence;
                const status =
                    primaryPresence.status === "offline" ? "invisible" : primaryPresence.status;
                client.user?.setPresence({
                    activities: primaryPresence.activities.map((activity) => ({
                        name: activity.name,
                        type: activity.type,
                        url: activity.url ?? undefined,
                    })),
                    status,
                });
                this.container.logger.info(
                    `[MultiBot] Copied presence from primary bot: ${status}`,
                );
            } else {
                client.user?.setPresence({
                    activities: [
                        {
                            name: i18n.__("events.cmdLoading"),
                            type: ActivityType.Playing,
                        },
                    ],
                    status: "dnd",
                });
            }
        } else {
            client.user?.setPresence({
                activities: [
                    {
                        name: i18n.__("events.cmdLoading"),
                        type: ActivityType.Playing,
                    },
                ],
                status: "dnd",
            });
        }

        this.container.logger.info(`Ready took ${formatMS(Date.now() - client.startTimestamp)}`);

        await this.doPresence();
        this.container.logger.info(
            await this.formatString(
                "{username} is ready to serve {userCount} users on {serverCount} guilds in " +
                    "{textChannelCount} text channels and {voiceChannelCount} voice channels.",
            ),
        );

        await this.cleanupOrphanedGuildData();
        await this.validateRequestChannels();
        await this.restoreRequestChannelMessages();
        await this.restoreQueueStates();
    }

    private async cleanupOrphanedGuildData(): Promise<void> {
        const client = this.currentClient;
        const botId = client.user?.id ?? "unknown";

        const isPrimaryOrSingle =
            !this.container.config.isMultiBot || client.multiBotManager.getPrimaryBot() === client;
        if (!isPrimaryOrSingle) {
            return;
        }

        if (!hasExtendedMethods(this.container.data)) {
            return;
        }

        const dataManager = this.container.data;
        const dbGuildIds = dataManager.getAllGuildIds();
        const botGuildIds = new Set(client.guilds.cache.keys());

        if (this.container.config.isMultiBot) {
            const bots = client.multiBotManager.getBots();
            for (const bot of bots) {
                for (const guildId of bot.client.guilds.cache.keys()) {
                    botGuildIds.add(guildId);
                }
            }
        }

        let cleanedCount = 0;
        for (const dbGuildId of dbGuildIds) {
            if (!botGuildIds.has(dbGuildId)) {
                const guild = client.guilds.cache.get(dbGuildId);
                if (guild) {
                    this.container.logger.debug(
                        `[Cleanup] Guild ${dbGuildId} found in cache after all, skipping cleanup`,
                    );
                    continue;
                }

                if (this.container.config.isMultiBot) {
                    let foundInAnyBot = false;
                    const bots = client.multiBotManager.getBots();
                    for (const bot of bots) {
                        if (bot.client.guilds.cache.has(dbGuildId)) {
                            foundInAnyBot = true;
                            break;
                        }
                    }
                    if (foundInAnyBot) {
                        this.container.logger.debug(
                            `[Cleanup] Guild ${dbGuildId} found in another bot's cache, skipping cleanup`,
                        );
                        continue;
                    }
                }

                this.container.logger.info(
                    `[Cleanup] Removing orphaned data for guild ${dbGuildId} - bot is no longer a member`,
                );

                try {
                    await dataManager.deleteRequestChannel(dbGuildId, botId);
                    await dataManager.deletePlayerState(dbGuildId, botId);
                    await dataManager.deleteQueueState(dbGuildId, botId);

                    if (
                        !this.container.config.isMultiBot &&
                        "deleteGuildData" in dataManager &&
                        typeof dataManager.deleteGuildData === "function"
                    ) {
                        await dataManager.deleteGuildData(dbGuildId);
                    }

                    cleanedCount++;
                } catch (error) {
                    this.container.logger.error(
                        `[Cleanup] Failed to clean up data for guild ${dbGuildId}:`,
                        error,
                    );
                }
            }
        }

        if (cleanedCount > 0) {
            this.container.logger.info(
                `[Cleanup] Cleaned up orphaned data for ${cleanedCount} guild(s)`,
            );
        }
    }

    private async validateRequestChannels(): Promise<void> {
        const client = this.currentClient;
        const botId = client.user?.id ?? "unknown";
        const data = this.container.data.data;
        if (!data) {
            return;
        }

        for (const guildId of Object.keys(data)) {
            const guild = client.guilds.cache.get(guildId);
            if (!guild) {
                continue;
            }

            let requestChannelData: { channelId: string | null; messageId: string | null } | null =
                null;

            if (hasGetRequestChannel(this.container.data)) {
                requestChannelData = this.container.data.getRequestChannel(guildId, botId);
            } else {
                requestChannelData = data[guildId]?.requestChannel ?? null;
            }

            if (!requestChannelData?.channelId) {
                continue;
            }

            const channel = guild.channels.cache.get(requestChannelData.channelId);

            if (!channel || channel.type !== ChannelType.GuildText) {
                this.container.logger.warn(
                    `[Validation] Request channel ${requestChannelData.channelId} for guild ${guild.name} (${guildId}) is invalid. Cleaning up...`,
                );

                try {
                    await this.container.requestChannelManager.setRequestChannel(guild, null);
                    this.container.logger.info(
                        `[Validation] Cleaned up invalid request channel for guild ${guild.name} (${guildId})`,
                    );
                } catch (error) {
                    this.container.logger.error(
                        `[Validation] Failed to clean up invalid request channel for guild ${guildId}:`,
                        error,
                    );
                }
            }
        }
    }

    private async restoreQueueStates(): Promise<void> {
        const client = this.currentClient;
        const botId = client.user?.id ?? "unknown";

        const queueStates: Array<{
            guildId: string;
            queueState: NonNullable<GuildData["queueState"]>;
            botId?: string;
        }> = [];

        if (
            "getQueueState" in this.container.data &&
            typeof this.container.data.getQueueState === "function"
        ) {
            const data = this.container.data.data;
            if (data) {
                for (const guildId of Object.keys(data)) {
                    const queueState = (this.container.data as any).getQueueState(guildId, botId);
                    if (queueState && queueState.songs.length > 0) {
                        queueStates.push({ guildId, queueState, botId });
                        this.container.logger.info(
                            `[Restore] Found queue state for guild ${guildId} from this bot ${botId}`,
                        );
                    }
                }
            }
        } else {
            const data = this.container.data.data;
            if (!data) {
                return;
            }

            for (const [guildId, guildData] of Object.entries(data)) {
                const queueState = guildData?.queueState;
                if (queueState && queueState.songs.length > 0) {
                    queueStates.push({ guildId, queueState, botId });
                }
            }
        }

        if (queueStates.length === 0) {
            return;
        }

        const restorePromises = queueStates.map(
            async ({ guildId, queueState, botId: queueOwnerBotId }) => {
                const guild = client.guilds.cache.get(guildId);
                if (!guild) {
                    return;
                }

                const textChannel = guild.channels.cache.get(queueState.textChannelId);
                if (!textChannel || textChannel.type !== ChannelType.GuildText) {
                    this.container.logger.warn(
                        `Could not find text channel ${queueState.textChannelId} for queue restore in guild ${guildId}`,
                    );
                    return;
                }

                const voiceChannel = guild.channels.cache.get(queueState.voiceChannelId);
                if (!voiceChannel) {
                    this.container.logger.warn(
                        `Could not find voice channel ${queueState.voiceChannelId} for queue restore in guild ${guildId}`,
                    );
                    return;
                }
                const isVoiceBased = voiceChannel.isVoiceBased();
                if (!isVoiceBased) {
                    this.container.logger.warn(
                        `Channel ${queueState.voiceChannelId} is not a voice channel for queue restore in guild ${guildId}`,
                    );
                    return;
                }

                const membersInChannel = voiceChannel.members.size;
                if (membersInChannel === 0) {
                    this.container.logger.warn(
                        `[Restore] ❌ Cancelling restore for guild ${guild.name} (${guildId}): Voice channel ${voiceChannel.name} (${voiceChannel.id}) is empty`,
                    );
                    return;
                }

                this.container.logger.info(
                    `[Restore] ✅ Voice channel validation passed: channel="${voiceChannel.name}" (${voiceChannel.id}), members=${membersInChannel}`,
                );

                try {
                    this.container.logger.info(
                        `[Restore] Restoring queue for guild ${guild.name} (${guildId}): ` +
                            `restoringBotId=${botId}, queueOwnerBotId=${queueOwnerBotId ?? "none"}, isMultiBot=${this.container.config.isMultiBot}`,
                    );

                    guild.queue = new ServerQueue(textChannel);

                    if (queueOwnerBotId) {
                        this.container.logger.info(
                            `[Restore] ✅ Queue owner bot ID provided (${queueOwnerBotId}). Attempting to load player state from queue owner bot for guild ${guild.name} (restoringBotId=${botId})`,
                        );

                        if (
                            "getPlayerState" in this.container.data &&
                            typeof this.container.data.getPlayerState === "function"
                        ) {
                            this.container.logger.info(
                                `[Restore] Calling getPlayerState(guildId=${guildId}, botId=${queueOwnerBotId})`,
                            );
                            const savedState = (this.container.data as any).getPlayerState(
                                guildId,
                                queueOwnerBotId,
                            );

                            this.container.logger.info(
                                `[Restore] getPlayerState result for guild ${guildId}, botId ${queueOwnerBotId}: ${savedState ? "✅ FOUND" : "❌ NOT FOUND"}`,
                            );

                            if (savedState && typeof savedState === "object") {
                                this.container.logger.info(
                                    `[Restore] Player state data received: loop=${String(savedState?.loopMode)}, shuffle=${String(savedState?.shuffle)}, volume=${String(savedState?.volume)}, hasFilters=${!!savedState?.filters}`,
                                );

                                if (!guild.queue) {
                                    this.container.logger.error(
                                        `[Restore] ❌ guild.queue is undefined when trying to set player state!`,
                                    );
                                    throw new Error("guild.queue is undefined");
                                }

                                try {
                                    const loopMode = savedState.loopMode ?? "OFF";
                                    const shuffle = savedState.shuffle ?? false;
                                    const volume = savedState.volume ?? defaultVolume;
                                    const filters = savedState.filters ?? {};

                                    this.container.logger.info(
                                        `[Restore] Setting player state: loop=${loopMode}, shuffle=${shuffle}, volume=${volume}, filters=${JSON.stringify(filters)}`,
                                    );

                                    guild.queue.loopMode = loopMode;
                                    guild.queue.shuffle = shuffle;
                                    (guild.queue as any)._volume = volume;
                                    guild.queue.filters = filters as Partial<
                                        Record<keyof typeof filterArgs, boolean>
                                    >;

                                    this.container.logger.info(
                                        `[Restore] ✅ Loaded player state from queue owner bot ${queueOwnerBotId} for guild ${guild.name}: ` +
                                            `loop=${guild.queue.loopMode}, shuffle=${guild.queue.shuffle}, volume=${guild.queue.volume}, filters=${JSON.stringify(guild.queue.filters)}`,
                                    );
                                    void guild.queue.saveState();
                                } catch (setError) {
                                    this.container.logger.error(
                                        `[Restore] ❌ Error setting player state: ${setError}`,
                                    );
                                    throw setError;
                                }
                            } else {
                                this.container.logger.warn(
                                    `[Restore] ⚠️ Queue restored from bot ${queueOwnerBotId}, but no player state found for that bot in guild ${guildId}. ` +
                                        `This might mean player state was never saved, or botId mismatch. Using defaults from ServerQueue constructor.`,
                                );
                            }
                        } else {
                            this.container.logger.warn(
                                `[Restore] ❌ getPlayerState method not available in SQLiteDataManager`,
                            );
                        }
                    } else {
                        this.container.logger.warn(
                            `[Restore] ⚠️ No queueOwnerBotId provided for guild ${guild.name}, player state loaded from ServerQueue constructor may be incorrect`,
                        );
                    }

                    if (guild.queue) {
                        this.container.logger.info(
                            `[Restore] Queue created for guild ${guild.name}, player state: ` +
                                `loop=${guild.queue.loopMode}, shuffle=${guild.queue.shuffle}, volume=${guild.queue.volume}, filters=${JSON.stringify(guild.queue.filters)}`,
                        );
                    } else {
                        this.container.logger.error(
                            `[Restore] ❌ guild.queue is undefined after creation!`,
                        );
                    }

                    const memberFetches = queueState.songs.map(async (savedSong) => {
                        const member = await guild.members
                            .fetch(savedSong.requesterId)
                            .catch(() => null);
                        if (member) {
                            guild.queue?.songs.restoreSong(
                                savedSong.key,
                                savedSong.index,
                                savedSong.song,
                                member,
                            );
                        }
                    });
                    await Promise.all(memberFetches);

                    if (guild.queue.songs.size === 0) {
                        await guild.queue.clearQueueState();
                        delete guild.queue;
                        this.container.logger.warn(
                            `No valid songs to restore for guild ${guild.name}(${guildId})`,
                        );
                        return;
                    }

                    const adapterCreator = createVoiceAdapter(client, guild.id);

                    const connection = joinVoiceChannel({
                        adapterCreator,
                        channelId: voiceChannel.id,
                        guildId: guild.id,
                        selfDeaf: true,
                        group: client.user?.id ?? "default",
                    }).on("debug", (message) => {
                        this.container.logger.debug(message);
                    });

                    guild.queue.connection = connection;

                    const currentSongKey = queueState.currentSongKey;
                    const currentPosition = queueState.currentPosition ?? 0;
                    const firstSongKey = guild.queue.songs.sortByIndex().first()?.key;
                    const startSongKey =
                        currentSongKey !== null &&
                        currentSongKey.length > 0 &&
                        guild.queue.songs.has(currentSongKey)
                            ? currentSongKey
                            : firstSongKey;

                    this.container.logger.info(
                        `[Restore] Queue state: currentSongKey=${currentSongKey ?? "none"}, currentPosition=${currentPosition}s, startSongKey=${startSongKey ?? "none"}`,
                    );

                    if (startSongKey !== undefined) {
                        const song = guild.queue.songs.get(startSongKey);
                        let seekPosition = 0;

                        if (startSongKey === currentSongKey && song) {
                            const songDuration = song.song.duration ?? 0;

                            this.container.logger.info(
                                `[Restore] Validating seek: song="${song.song.title}", savedPosition=${currentPosition}s, duration=${songDuration}s`,
                            );

                            if (
                                songDuration > 0 &&
                                currentPosition >= 0 &&
                                currentPosition < songDuration
                            ) {
                                seekPosition = currentPosition;
                                this.container.logger.info(
                                    `[Restore] ✅ Restoring song "${song.song.title}" at position ${currentPosition}s (duration: ${songDuration}s, remaining: ${songDuration - currentPosition}s)`,
                                );
                            } else {
                                if (songDuration <= 0) {
                                    this.container.logger.warn(
                                        `[Restore] ❌ Invalid song duration ${songDuration}s for "${song.song.title}", starting from beginning`,
                                    );
                                } else {
                                    this.container.logger.warn(
                                        `[Restore] ❌ Invalid seek position ${currentPosition}s for song "${song.song.title}" (duration: ${songDuration}s), starting from beginning`,
                                    );
                                }
                                seekPosition = 0;
                            }
                        } else {
                            this.container.logger.info(
                                `[Restore] Different song or no match: startSongKey=${startSongKey}, currentSongKey=${currentSongKey ?? "none"}, starting from beginning`,
                            );
                            seekPosition = 0;
                        }

                        this.container.logger.info(
                            `[Restore] Calling play() with seekPosition=${seekPosition}s`,
                        );
                        void play(guild, startSongKey, false, seekPosition);
                    }

                    this.container.logger.info(
                        `Restored queue for guild ${guild.name}(${guildId}) with ${guild.queue.songs.size} songs`,
                    );
                } catch (error) {
                    this.container.logger.error(
                        `Failed to restore queue for guild ${guildId}:`,
                        error,
                    );
                    if (guild.queue) {
                        await guild.queue.destroy();
                    }
                }
            },
        );

        await Promise.all(restorePromises);
    }

    private async restoreRequestChannelMessages(): Promise<void> {
        const client = this.currentClient;
        const data = this.container.data.data;
        if (!data) {
            return;
        }

        const restorePromises = Object.keys(data).map(async (guildId) => {
            const guild = client.guilds.cache.get(guildId);
            if (!guild) {
                return;
            }
            if (!this.container.requestChannelManager.hasRequestChannel(guild)) {
                return;
            }

            try {
                await this.container.requestChannelManager.createOrUpdatePlayerMessage(guild);
                this.container.logger.info(
                    `Restored request channel player message for guild ${guild.name}(${guild.id})`,
                );
            } catch (error) {
                this.container.logger.error(
                    `Failed to restore request channel for guild ${guildId}:`,
                    error,
                );
            }
        });

        await Promise.all(restorePromises);
    }

    private async formatString(text: string): Promise<string> {
        const client = this.currentClient;
        let newText = text;

        if (text.includes("{userCount}")) {
            const users = await this.container.utils.getUserCount();

            newText = newText.replaceAll("{userCount}", users.toString());
        }
        if (text.includes("{textChannelCount}")) {
            const textChannels = await this.container.utils.getChannelCount(true);

            newText = newText.replaceAll("{textChannelCount}", textChannels.toString());
        }
        if (text.includes("{voiceChannelCount}")) {
            const voiceChannels = await this.container.utils.getChannelCount(false, true);

            newText = newText.replaceAll("{voiceChannelCount}", voiceChannels.toString());
        }
        if (text.includes("{serverCount}")) {
            const guilds = await this.container.utils.getGuildCount();

            newText = newText.replaceAll("{serverCount}", guilds.toString());
        }
        if (text.includes("{playingCount}")) {
            const playings = await this.container.utils.getPlayingCount();

            newText = newText.replaceAll("{playingCount}", playings.toString());
        }

        return newText
            .replaceAll("{prefix}", this.container.config.mainPrefix)
            .replaceAll("{username}", client.user?.username ?? "");
    }

    private async setPresence(random: boolean): Promise<Presence> {
        const client = this.currentClient;
        const activityNumber = random
            ? Math.floor(Math.random() * this.container.config.presenceData.activities.length)
            : 0;
        const statusNumber = random
            ? Math.floor(Math.random() * this.container.config.presenceData.status.length)
            : 0;
        const activity: {
            name: string;
            type: EnvActivityTypes;
            typeNumber: number;
        } = await Promise.all(
            this.container.config.presenceData.activities.map(async (a) => {
                let type = ActivityType.Playing;

                if (a.type === "Competing") {
                    type = ActivityType.Competing;
                }
                if (a.type === "Watching") {
                    type = ActivityType.Watching;
                }
                if (a.type === "Listening") {
                    type = ActivityType.Listening;
                }

                return Object.assign(a, {
                    name: await this.formatString(a.name),
                    type: a.type,
                    typeNumber: type,
                });
            }),
        ).then((x) => x[activityNumber]);

        return client.user?.setPresence({
            activities: (activity as { name: string } | undefined)
                ? [
                      {
                          name: activity.name,
                          type: activity.typeNumber,
                      },
                  ]
                : [],
            status: this.container.config.presenceData.status[statusNumber],
        }) as Presence;
    }

    private async doPresence(): Promise<Presence | undefined> {
        const client = this.currentClient;
        try {
            if (this.container.config.isMultiBot) {
                const primaryBot = client.multiBotManager.getPrimaryBot();
                if (primaryBot && primaryBot !== client && primaryBot.user) {
                    const syncPresence = async (): Promise<void> => {
                        try {
                            const primaryPresence = primaryBot.user?.presence;
                            if (primaryPresence) {
                                const status =
                                    primaryPresence.status === "offline"
                                        ? "invisible"
                                        : primaryPresence.status;
                                await client.user?.setPresence({
                                    activities: primaryPresence.activities.map((activity) => ({
                                        name: activity.name,
                                        type: activity.type,
                                        url: activity.url ?? undefined,
                                    })),
                                    status,
                                });
                            }
                        } catch (error) {
                            this.container.logger.error("PRESENCE_SYNC_ERR:", error);
                        }
                    };

                    await syncPresence();

                    setInterval(syncPresence, this.container.config.presenceData.interval);
                    return undefined;
                }
            }

            return await this.setPresence(false);
        } catch (error) {
            if ((error as Error).message !== "Shards are still being spawned.") {
                this.container.logger.error(String(error));
            }
            return undefined;
        } finally {
            if (
                !this.container.config.isMultiBot ||
                client.multiBotManager.getPrimaryBot() === client
            ) {
                setInterval(
                    async () => this.setPresence(true),
                    this.container.config.presenceData.interval,
                );
            }
        }
    }
}
