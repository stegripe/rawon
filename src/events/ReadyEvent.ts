import { setInterval } from "node:timers";
import { joinVoiceChannel } from "@discordjs/voice";
import { ActivityType, ChannelType, type Presence } from "discord.js";
import i18n from "../config/index.js";
import { BaseEvent } from "../structures/BaseEvent.js";
import { ServerQueue } from "../structures/ServerQueue.js";
import { type EnvActivityTypes, type GuildData } from "../typings/index.js";
import { Event } from "../utils/decorators/Event.js";
import { createVoiceAdapter } from "../utils/functions/createVoiceAdapter.js";
import { type filterArgs } from "../utils/functions/ffmpegArgs.js";
import { formatMS } from "../utils/functions/formatMS.js";
import { play } from "../utils/handlers/GeneralUtil.js";

@Event<typeof ReadyEvent>("clientReady")
export class ReadyEvent extends BaseEvent {
    public async execute(): Promise<void> {
        if (this.client.application?.owner) {
            this.client.config.devs.push(this.client.application.owner.id);
        }

        await this.client.spotify.renew();

        if (this.client.config.isMultiBot) {
            const primaryBot = this.client.multiBotManager.getPrimaryBot();
            if (primaryBot && primaryBot !== this.client && primaryBot.user) {
                const primaryPresence = primaryBot.user.presence;
                const status =
                    primaryPresence.status === "offline" ? "invisible" : primaryPresence.status;
                this.client.user?.setPresence({
                    activities: primaryPresence.activities.map((activity) => ({
                        name: activity.name,
                        type: activity.type,
                        url: activity.url ?? undefined,
                    })),
                    status,
                });
                this.client.logger.info(`[MultiBot] Copied presence from primary bot: ${status}`);
            } else {
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

        const queueStates: Array<{
            guildId: string;
            queueState: NonNullable<GuildData["queueState"]>;
            botId?: string;
        }> = [];

        if (
            "getQueueState" in this.client.data &&
            typeof this.client.data.getQueueState === "function"
        ) {
            const data = this.client.data.data;
            if (data) {
                // In multi-bot mode, each bot should ONLY restore its OWN queue state
                // This prevents rawon2 from restoring rawon1's queue after restart
                for (const guildId of Object.keys(data)) {
                    const queueState = (this.client.data as any).getQueueState(guildId, botId);
                    if (queueState && queueState.songs.length > 0) {
                        queueStates.push({ guildId, queueState, botId });
                        this.client.logger.info(
                            `[Restore] Found queue state for guild ${guildId} from this bot ${botId}`,
                        );
                    }
                }
            }
        } else {
            const data = this.client.data.data;
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

                const membersInChannel = voiceChannel.members.size;
                if (membersInChannel === 0) {
                    this.client.logger.warn(
                        `[Restore] ❌ Cancelling restore for guild ${guild.name} (${guildId}): Voice channel ${voiceChannel.name} (${voiceChannel.id}) is empty`,
                    );
                    return;
                }

                this.client.logger.info(
                    `[Restore] ✅ Voice channel validation passed: channel="${voiceChannel.name}" (${voiceChannel.id}), members=${membersInChannel}`,
                );

                try {
                    this.client.logger.info(
                        `[Restore] Restoring queue for guild ${guild.name} (${guildId}): ` +
                            `restoringBotId=${botId}, queueOwnerBotId=${queueOwnerBotId ?? "none"}, isMultiBot=${this.client.config.isMultiBot}`,
                    );

                    guild.queue = new ServerQueue(textChannel);

                    if (queueOwnerBotId) {
                        this.client.logger.info(
                            `[Restore] ✅ Queue owner bot ID provided (${queueOwnerBotId}). Attempting to load player state from queue owner bot for guild ${guild.name} (restoringBotId=${botId})`,
                        );

                        if (
                            "getPlayerState" in this.client.data &&
                            typeof this.client.data.getPlayerState === "function"
                        ) {
                            this.client.logger.info(
                                `[Restore] Calling getPlayerState(guildId=${guildId}, botId=${queueOwnerBotId})`,
                            );
                            const savedState = (this.client.data as any).getPlayerState(
                                guildId,
                                queueOwnerBotId,
                            );

                            this.client.logger.info(
                                `[Restore] getPlayerState result for guild ${guildId}, botId ${queueOwnerBotId}: ${savedState ? "✅ FOUND" : "❌ NOT FOUND"}`,
                            );

                            if (savedState && typeof savedState === "object") {
                                this.client.logger.info(
                                    `[Restore] Player state data received: loop=${String(savedState?.loopMode)}, shuffle=${String(savedState?.shuffle)}, volume=${String(savedState?.volume)}, hasFilters=${!!savedState?.filters}`,
                                );

                                if (!guild.queue) {
                                    this.client.logger.error(
                                        `[Restore] ❌ guild.queue is undefined when trying to set player state!`,
                                    );
                                    throw new Error("guild.queue is undefined");
                                }

                                try {
                                    const loopMode = savedState.loopMode ?? "OFF";
                                    const shuffle = savedState.shuffle ?? false;
                                    const volume = savedState.volume ?? 100;
                                    const filters = savedState.filters ?? {};

                                    this.client.logger.info(
                                        `[Restore] Setting player state: loop=${loopMode}, shuffle=${shuffle}, volume=${volume}, filters=${JSON.stringify(filters)}`,
                                    );

                                    guild.queue.loopMode = loopMode;
                                    guild.queue.shuffle = shuffle;
                                    (guild.queue as any)._volume = volume;
                                    guild.queue.filters = filters as Partial<
                                        Record<keyof typeof filterArgs, boolean>
                                    >;

                                    this.client.logger.info(
                                        `[Restore] ✅ Loaded player state from queue owner bot ${queueOwnerBotId} for guild ${guild.name}: ` +
                                            `loop=${guild.queue.loopMode}, shuffle=${guild.queue.shuffle}, volume=${guild.queue.volume}, filters=${JSON.stringify(guild.queue.filters)}`,
                                    );
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

                    const adapterCreator = createVoiceAdapter(this.client, guild.id);

                    const connection = joinVoiceChannel({
                        adapterCreator,
                        channelId: voiceChannel.id,
                        guildId: guild.id,
                        selfDeaf: true,
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

                        if (startSongKey === currentSongKey && song) {
                            const songDuration = song.song.duration ?? 0;

                            this.client.logger.info(
                                `[Restore] Validating seek: song="${song.song.title}", savedPosition=${currentPosition}s, duration=${songDuration}s`,
                            );

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
                    this.client.logger.error(
                        `Failed to restore queue for guild ${guildId}:`,
                        error,
                    );
                    if (guild.queue) {
                        guild.queue.destroy();
                    }
                }
            },
        );

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
            if (this.client.config.isMultiBot) {
                const primaryBot = this.client.multiBotManager.getPrimaryBot();
                if (primaryBot && primaryBot !== this.client && primaryBot.user) {
                    const syncPresence = async (): Promise<void> => {
                        try {
                            const primaryPresence = primaryBot.user?.presence;
                            if (primaryPresence) {
                                const status =
                                    primaryPresence.status === "offline"
                                        ? "invisible"
                                        : primaryPresence.status;
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

                    await syncPresence();

                    setInterval(syncPresence, this.client.config.presenceData.interval);
                    return undefined;
                }
            }

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
                setInterval(
                    async () => this.setPresence(true),
                    this.client.config.presenceData.interval,
                );
            }
        }
    }
}
