import { setInterval } from "node:timers";
import { joinVoiceChannel } from "@discordjs/voice";
import { ActivityType, ChannelType, type Presence } from "discord.js";
import i18n from "../config/index.js";
import { BaseEvent } from "../structures/BaseEvent.js";
import { ServerQueue } from "../structures/ServerQueue.js";
import { type EnvActivityTypes, type GuildData } from "../typings/index.js";
import { Event } from "../utils/decorators/Event.js";
import { formatMS } from "../utils/functions/formatMS.js";
import { play } from "../utils/handlers/GeneralUtil.js";
import { createVoiceAdapter } from "../utils/functions/createVoiceAdapter.js";
import { filterArgs } from "../utils/functions/ffmpegArgs.js";

@Event<typeof ReadyEvent>("ready")
export class ReadyEvent extends BaseEvent {
    public async execute(): Promise<void> {
        if (this.client.application?.owner) {
            this.client.config.devs.push(this.client.application.owner.id);
        }

        await this.client.spotify.renew();

        // Multi-bot: Secondary bots copy presence from primary bot
        if (this.client.config.isMultiBot) {
            const primaryBot = this.client.multiBotManager.getPrimaryBot();
            if (primaryBot && primaryBot !== this.client && primaryBot.user) {
                // Copy presence from primary bot
                const primaryPresence = primaryBot.user.presence;
                const status = primaryPresence.status === "offline" ? "invisible" : primaryPresence.status;
                this.client.user?.setPresence({
                    activities: primaryPresence.activities.map((activity) => ({
                        name: activity.name,
                        type: activity.type,
                        url: activity.url ?? undefined,
                    })),
                    status,
                });
                this.client.logger.info(
                    `[MultiBot] Copied presence from primary bot: ${status}`,
                );
            } else {
                // Primary bot or single bot mode - set default
                this.client.user?.setPresence({
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
            // Single bot mode
            this.client.user?.setPresence({
                activities: [
                    {
                        name: i18n.__("events.cmdLoading"),
                        type: ActivityType.Playing,
                    },
                ],
                status: "dnd",
            });
        }

        await this.client.commands.load();
        this.client.logger.info(`Ready took ${formatMS(Date.now() - this.client.startTimestamp)}`);

        await this.doPresence();
        this.client.logger.info(
            await this.formatString(
                "{username} is ready to serve {userCount} users on {serverCount} guilds in " +
                    "{textChannelCount} text channels and {voiceChannelCount} voice channels.",
            ),
        );

        await this.restoreRequestChannelMessages();
        await this.restoreQueueStates();
    }

    private async restoreQueueStates(): Promise<void> {
        const botId = this.client.user?.id ?? "unknown";
        
        // Use SQLite-specific method if available, otherwise fallback to JSON method
        let queueStates: Array<{ guildId: string; queueState: NonNullable<GuildData["queueState"]>; botId?: string }> = [];
        
        if ("getQueueState" in this.client.data && typeof this.client.data.getQueueState === "function") {
            // Load queue states from SQLite for ALL bot instances, not just this bot
            // This ensures we restore queues even if they were saved by a different bot
            const data = this.client.data.data;
            if (data) {
                // Get all bots in multi-bot mode to check their queue states
                const botsToCheck = this.client.config.isMultiBot 
                    ? this.client.multiBotManager.getBots().map(b => b.botId)
                    : [botId];
                
                // Check each guild for queue states from any bot
                for (const guildId of Object.keys(data)) {
                    // Check queue state from all bots, not just this bot
                    for (const checkBotId of botsToCheck) {
                        const queueState = (this.client.data as any).getQueueState(guildId, checkBotId);
                        if (queueState && queueState.songs.length > 0) {
                            // Store botId that owns this queue state so we can load player state from the same bot
                            queueStates.push({ guildId, queueState, botId: checkBotId });
                            this.client.logger.info(
                                `[Restore] Found queue state for guild ${guildId} from bot ${checkBotId}`,
                            );
                            break; // Only restore one queue per guild (the first found)
                        }
                    }
                }
            }
        } else {
            // Fallback to JSON method for backward compatibility
            const data = this.client.data.data;
            if (!data) {
                return;
            }

            for (const [guildId, guildData] of Object.entries(data)) {
                const queueState = guildData?.queueState;
                if (queueState && queueState.songs.length > 0) {
                    // For JSON mode, use current botId
                    queueStates.push({ guildId, queueState, botId });
                }
            }
        }

        if (queueStates.length === 0) {
            return;
        }

        const restorePromises = queueStates.map(async ({ guildId, queueState, botId: queueOwnerBotId }) => {

            const guild = this.client.guilds.cache.get(guildId);
            if (!guild) {
                return;
            }

            const textChannel = guild.channels.cache.get(queueState.textChannelId);
            if (!textChannel || textChannel.type !== ChannelType.GuildText) {
                this.client.logger.warn(
                    `Could not find text channel ${queueState.textChannelId} for queue restore in guild ${guildId}`,
                );
                return;
            }

            const voiceChannel = guild.channels.cache.get(queueState.voiceChannelId);
            if (!voiceChannel) {
                this.client.logger.warn(
                    `Could not find voice channel ${queueState.voiceChannelId} for queue restore in guild ${guildId}`,
                );
                return;
            }
            const isVoiceBased = voiceChannel.isVoiceBased();
            if (!isVoiceBased) {
                this.client.logger.warn(
                    `Channel ${queueState.voiceChannelId} is not a voice channel for queue restore in guild ${guildId}`,
                );
                return;
            }

            try {
                this.client.logger.info(
                    `[Restore] Restoring queue for guild ${guild.name} (${guildId}): ` +
                    `restoringBotId=${botId}, queueOwnerBotId=${queueOwnerBotId ?? "none"}, isMultiBot=${this.client.config.isMultiBot}`,
                );
                
                // Create ServerQueue - this will call loadSavedState() in constructor
                // BUT: loadSavedState() uses this.client.user?.id, which might be different from queueOwnerBotId
                // So we need to load player state from the bot that owns the queue state, not the bot restoring it
                guild.queue = new ServerQueue(textChannel);
                
                // ALWAYS try to load player state from the bot that owns the queue state
                // Note: We don't check isMultiBot because in multi-bot mode, each bot instance
                // sees isMultiBot=false (token already split). Instead, we check if queueOwnerBotId exists,
                // which indicates we're restoring a queue that was saved by a specific bot.
                // Even if restoringBotId === queueOwnerBotId, we should still explicitly load it
                // because loadSavedState() in constructor might have failed (e.g., client.user not available yet)
                if (queueOwnerBotId) {
                    this.client.logger.info(
                        `[Restore] ✅ Queue owner bot ID provided (${queueOwnerBotId}). Attempting to load player state from queue owner bot for guild ${guild.name} (restoringBotId=${botId})`,
                    );
                    
                    if ("getPlayerState" in this.client.data && typeof this.client.data.getPlayerState === "function") {
                        this.client.logger.info(
                            `[Restore] Calling getPlayerState(guildId=${guildId}, botId=${queueOwnerBotId})`,
                        );
                        const savedState = (this.client.data as any).getPlayerState(guildId, queueOwnerBotId);
                        
                        this.client.logger.info(
                            `[Restore] getPlayerState result for guild ${guildId}, botId ${queueOwnerBotId}: ${savedState ? "✅ FOUND" : "❌ NOT FOUND"}`,
                        );
                        
                        if (savedState && typeof savedState === "object") {
                            this.client.logger.info(
                                `[Restore] Player state data received: loop=${String(savedState?.loopMode)}, shuffle=${String(savedState?.shuffle)}, volume=${String(savedState?.volume)}, hasFilters=${!!savedState?.filters}`,
                            );
                            
                            // Ensure guild.queue exists before accessing its properties
                            if (!guild.queue) {
                                this.client.logger.error(
                                    `[Restore] ❌ guild.queue is undefined when trying to set player state!`,
                                );
                                throw new Error("guild.queue is undefined");
                            }
                            
                            try {
                                // Safely extract values with defaults
                                const loopMode = savedState.loopMode ?? "OFF";
                                const shuffle = savedState.shuffle ?? false;
                                const volume = savedState.volume ?? 100;
                                const filters = savedState.filters ?? {};
                                
                                this.client.logger.info(
                                    `[Restore] Setting player state: loop=${loopMode}, shuffle=${shuffle}, volume=${volume}, filters=${JSON.stringify(filters)}`,
                                );
                                
                                guild.queue.loopMode = loopMode;
                                guild.queue.shuffle = shuffle;
                                // IMPORTANT: Don't use setter for volume during restore, as the player might not be initialized yet
                                // Use direct assignment to _volume instead to avoid accessing undefined resource
                                (guild.queue as any)._volume = volume;
                                guild.queue.filters = filters as Partial<
                                    Record<keyof typeof filterArgs, boolean>
                                >;
                                
                                this.client.logger.info(
                                    `[Restore] ✅ Loaded player state from queue owner bot ${queueOwnerBotId} for guild ${guild.name}: ` +
                                    `loop=${guild.queue.loopMode}, shuffle=${guild.queue.shuffle}, volume=${guild.queue.volume}, filters=${JSON.stringify(guild.queue.filters)}`,
                                );
                                // Save this player state to this bot's record so it persists for future restarts
                                void guild.queue.saveState();
                            } catch (setError) {
                                this.client.logger.error(
                                    `[Restore] ❌ Error setting player state: ${setError}`,
                                );
                                throw setError;
                            }
                        } else {
                            this.client.logger.warn(
                                `[Restore] ⚠️ Queue restored from bot ${queueOwnerBotId}, but no player state found for that bot in guild ${guildId}. ` +
                                `This might mean player state was never saved, or botId mismatch. Using defaults from ServerQueue constructor.`,
                            );
                        }
                    } else {
                        this.client.logger.warn(
                            `[Restore] ❌ getPlayerState method not available in SQLiteDataManager`,
                        );
                    }
                } else {
                    this.client.logger.warn(
                        `[Restore] ⚠️ No queueOwnerBotId provided for guild ${guild.name}, player state loaded from ServerQueue constructor may be incorrect`,
                    );
                }
                
                // After ServerQueue is created, verify player state was loaded correctly
                if (guild.queue) {
                    this.client.logger.info(
                        `[Restore] Queue created for guild ${guild.name}, player state: ` +
                        `loop=${guild.queue.loopMode}, shuffle=${guild.queue.shuffle}, volume=${guild.queue.volume}, filters=${JSON.stringify(guild.queue.filters)}`,
                    );
                } else {
                    this.client.logger.error(
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
                    this.client.logger.warn(
                        `No valid songs to restore for guild ${guild.name}(${guildId})`,
                    );
                    return;
                }

                // Use custom voice adapter creator that explicitly uses THIS client
                // This ensures the connection uses the correct bot instance in multi-bot scenarios
                const adapterCreator = createVoiceAdapter(this.client, guild.id);

                    const connection = joinVoiceChannel({
                        adapterCreator,
                        channelId: voiceChannel.id,
                        guildId: guild.id,
                        selfDeaf: true,
                        // CRITICAL: Use bot's user ID as group to ensure each bot instance has isolated voice connections
                        // This prevents multiple bot instances from interfering with each other's voice connections
                        group: this.client.user?.id ?? "default",
                    }).on("debug", (message) => {
                        this.client.logger.debug(message);
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

                this.client.logger.info(
                    `[Restore] Queue state: currentSongKey=${currentSongKey ?? "none"}, currentPosition=${currentPosition}s, startSongKey=${startSongKey ?? "none"}`,
                );

                if (startSongKey !== undefined) {
                    const song = guild.queue.songs.get(startSongKey);
                    let seekPosition = 0;
                    
                    // Only use seek position if it's the same song and position is valid
                    if (startSongKey === currentSongKey && song) {
                        // Validate seek position: must be less than song duration and >= 0
                        // Also check if duration is valid (> 0)
                        const songDuration = song.song.duration ?? 0;
                        
                        this.client.logger.info(
                            `[Restore] Validating seek: song="${song.song.title}", savedPosition=${currentPosition}s, duration=${songDuration}s`,
                        );
                        
                        // Basic validation: duration must be valid and position must be within bounds
                        if (
                            songDuration > 0 &&
                            currentPosition >= 0 &&
                            currentPosition < songDuration
                        ) {
                            seekPosition = currentPosition;
                            this.client.logger.info(
                                `[Restore] ✅ Restoring song "${song.song.title}" at position ${currentPosition}s (duration: ${songDuration}s, remaining: ${songDuration - currentPosition}s)`,
                            );
                        } else {
                            if (songDuration <= 0) {
                                this.client.logger.warn(
                                    `[Restore] ❌ Invalid song duration ${songDuration}s for "${song.song.title}", starting from beginning`,
                                );
                            } else {
                                this.client.logger.warn(
                                    `[Restore] ❌ Invalid seek position ${currentPosition}s for song "${song.song.title}" (duration: ${songDuration}s), starting from beginning`,
                                );
                            }
                            seekPosition = 0;
                        }
                    } else {
                        // Different song or no song found, start from beginning
                        this.client.logger.info(
                            `[Restore] Different song or no match: startSongKey=${startSongKey}, currentSongKey=${currentSongKey ?? "none"}, starting from beginning`,
                        );
                        seekPosition = 0;
                    }
                    
                    this.client.logger.info(
                        `[Restore] Calling play() with seekPosition=${seekPosition}s`,
                    );
                    void play(guild, startSongKey, false, seekPosition);
                }

                this.client.logger.info(
                    `Restored queue for guild ${guild.name}(${guildId}) with ${guild.queue.songs.size} songs`,
                );
            } catch (error) {
                this.client.logger.error(`Failed to restore queue for guild ${guildId}:`, error);
                if (guild.queue) {
                    guild.queue.destroy();
                }
            }
        });

        await Promise.all(restorePromises);
    }

    private async restoreRequestChannelMessages(): Promise<void> {
        const data = this.client.data.data;
        if (!data) {
            return;
        }

        const restorePromises = Object.keys(data).map(async (guildId) => {
            const guild = this.client.guilds.cache.get(guildId);
            if (!guild) {
                return;
            }
            if (!this.client.requestChannelManager.hasRequestChannel(guild)) {
                return;
            }

            try {
                await this.client.requestChannelManager.createOrUpdatePlayerMessage(guild);
                this.client.logger.info(
                    `Restored request channel player message for guild ${guild.name}(${guild.id})`,
                );
            } catch (error) {
                this.client.logger.error(
                    `Failed to restore request channel for guild ${guildId}:`,
                    error,
                );
            }
        });

        await Promise.all(restorePromises);
    }

    private async formatString(text: string): Promise<string> {
        let newText = text;

        if (text.includes("{userCount}")) {
            const users = await this.client.utils.getUserCount();

            newText = newText.replaceAll("{userCount}", users.toString());
        }
        if (text.includes("{textChannelCount}")) {
            const textChannels = await this.client.utils.getChannelCount(true);

            newText = newText.replaceAll("{textChannelCount}", textChannels.toString());
        }
        if (text.includes("{voiceChannelCount}")) {
            const voiceChannels = await this.client.utils.getChannelCount(false, true);

            newText = newText.replaceAll("{voiceChannelCount}", voiceChannels.toString());
        }
        if (text.includes("{serverCount}")) {
            const guilds = await this.client.utils.getGuildCount();

            newText = newText.replaceAll("{serverCount}", guilds.toString());
        }
        if (text.includes("{playingCount}")) {
            const playings = await this.client.utils.getPlayingCount();

            newText = newText.replaceAll("{playingCount}", playings.toString());
        }

        return newText
            .replaceAll("{prefix}", this.client.config.mainPrefix)
            .replaceAll("{username}", this.client.user?.username ?? "");
    }

    private async setPresence(random: boolean): Promise<Presence> {
        const activityNumber = random
            ? Math.floor(Math.random() * this.client.config.presenceData.activities.length)
            : 0;
        const statusNumber = random
            ? Math.floor(Math.random() * this.client.config.presenceData.status.length)
            : 0;
        const activity: {
            name: string;
            type: EnvActivityTypes;
            typeNumber: number;
        } = await Promise.all(
            this.client.config.presenceData.activities.map(async (a) => {
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

        return this.client.user?.setPresence({
            activities: (activity as { name: string } | undefined)
                ? [
                      {
                          name: activity.name,
                          type: activity.typeNumber,
                      },
                  ]
                : [],
            status: this.client.config.presenceData.status[statusNumber],
        }) as Presence;
    }

    private async doPresence(): Promise<Presence | undefined> {
        try {
            // Multi-bot: Secondary bots sync presence with primary bot periodically
            if (this.client.config.isMultiBot) {
                const primaryBot = this.client.multiBotManager.getPrimaryBot();
                if (primaryBot && primaryBot !== this.client && primaryBot.user) {
                    // Sync presence from primary bot
                    const syncPresence = async (): Promise<void> => {
                        try {
                            const primaryPresence = primaryBot.user?.presence;
                            if (primaryPresence) {
                                const status = primaryPresence.status === "offline" ? "invisible" : primaryPresence.status;
                                await this.client.user?.setPresence({
                                    activities: primaryPresence.activities.map((activity) => ({
                                        name: activity.name,
                                        type: activity.type,
                                        url: activity.url ?? undefined,
                                    })),
                                    status,
                                });
                            }
                        } catch (error) {
                            this.client.logger.error("PRESENCE_SYNC_ERR:", error);
                        }
                    };

                    // Initial sync
                    await syncPresence();

                    // Sync periodically
                    setInterval(syncPresence, this.client.config.presenceData.interval);
                    return undefined;
                }
            }

            // Primary bot or single bot mode - use normal presence rotation
            return await this.setPresence(false);
        } catch (error) {
            if ((error as Error).message !== "Shards are still being spawned.") {
                this.client.logger.error(String(error));
            }
            return undefined;
        } finally {
            if (
                !this.client.config.isMultiBot ||
                this.client.multiBotManager.getPrimaryBot() === this.client
            ) {
                // Only primary bot rotates presence normally
                setInterval(
                    async () => this.setPresence(true),
                    this.client.config.presenceData.interval,
                );
            }
        }
    }
}
