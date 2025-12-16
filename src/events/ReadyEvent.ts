import { setInterval } from "node:timers";
import type { DiscordGatewayAdapterCreator } from "@discordjs/voice";
import { joinVoiceChannel } from "@discordjs/voice";
import { ActivityType, ChannelType, Presence } from "discord.js";
import i18n from "../config/index.js";
import { BaseEvent } from "../structures/BaseEvent.js";
import { ServerQueue } from "../structures/ServerQueue.js";
import type { EnvActivityTypes } from "../typings/index.js";
import { Event } from "../utils/decorators/Event.js";
import { formatMS } from "../utils/functions/formatMS.js";
import { play } from "../utils/handlers/GeneralUtil.js";

@Event<typeof ReadyEvent>("ready")
export class ReadyEvent extends BaseEvent {
    public async execute(): Promise<void> {
        if (this.client.application?.owner) {
            this.client.config.devs.push(this.client.application.owner.id);
        }

        await this.client.spotify.renew();

        this.client.user?.setPresence({
            activities: [
                {
                    name: i18n.__("events.cmdLoading"),
                    type: ActivityType.Playing
                }
            ],
            status: "dnd"
        })
        await this.client.commands.load();
        this.client.logger.info(`Ready took ${formatMS(Date.now() - this.client.startTimestamp)}`);

        await this.doPresence();
        this.client.logger.info(
            await this.formatString(
                "{username} is ready to serve {userCount} users on {serverCount} guilds in " +
                "{textChannelCount} text channels and {voiceChannelCount} voice channels."
            )
        );

        await this.restoreRequestChannelMessages();
        await this.restoreQueueStates();
    }

    private async restoreQueueStates(): Promise<void> {
        const data = this.client.data.data;
        if (!data) return;

        const restorePromises = Object.keys(data)
            .map(async guildId => {
                const guildData = data[guildId];
                const queueState = guildData?.queueState;
                if (!queueState || queueState.songs.length === 0) return;

                const guild = this.client.guilds.cache.get(guildId);
                if (!guild) return;

                const textChannel = guild.channels.cache.get(queueState.textChannelId);
                if (!textChannel || textChannel.type !== ChannelType.GuildText) {
                    this.client.logger.warn(`Could not find text channel ${queueState.textChannelId} for queue restore in guild ${guildId}`);
                    return;
                }

                const voiceChannel = guild.channels.cache.get(queueState.voiceChannelId);
                if (!voiceChannel) {
                    this.client.logger.warn(`Could not find voice channel ${queueState.voiceChannelId} for queue restore in guild ${guildId}`);
                    return;
                }
                const isVoiceBased = voiceChannel.isVoiceBased();
                if (!isVoiceBased) {
                    this.client.logger.warn(`Channel ${queueState.voiceChannelId} is not a voice channel for queue restore in guild ${guildId}`);
                    return;
                }

                try {
                    // Create a new queue
                    guild.queue = new ServerQueue(textChannel);

                    // Restore songs to the queue with their original keys and indices
                    const memberFetches = queueState.songs.map(async savedSong => {
                        const member = await guild.members.fetch(savedSong.requesterId).catch(() => null);
                        if (member) {
                            guild.queue?.songs.restoreSong(savedSong.key, savedSong.index, savedSong.song, member);
                        }
                    });
                    await Promise.all(memberFetches);

                    if (guild.queue.songs.size === 0) {
                        // Clear the invalid queue state to prevent repeated restoration attempts
                        await guild.queue.clearQueueState();
                        delete guild.queue;
                        this.client.logger.warn(`No valid songs to restore for guild ${guild.name}(${guildId})`);
                        return;
                    }

                    // Connect to voice channel
                    const connection = joinVoiceChannel({
                        adapterCreator: guild.voiceAdapterCreator as DiscordGatewayAdapterCreator,
                        channelId: voiceChannel.id,
                        guildId: guild.id,
                        selfDeaf: true
                    }).on("debug", message => {
                        this.client.logger.debug(message);
                    });

                    guild.queue.connection = connection;

                    // Start playing from the saved current song or the first song (by index)
                    const currentSongKey = queueState.currentSongKey;
                    const firstSongKey = guild.queue.songs.sortByIndex().first()?.key;
                    const startSongKey = currentSongKey !== null && currentSongKey.length > 0 && guild.queue.songs.has(currentSongKey)
                        ? currentSongKey
                        : firstSongKey;

                    if (startSongKey !== undefined) {
                        void play(guild, startSongKey);
                    }

                    this.client.logger.info(`Restored queue for guild ${guild.name}(${guildId}) with ${guild.queue.songs.size} songs`);
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
        if (!data) return;

        const restorePromises = Object.keys(data)
            .map(async guildId => {
                const guild = this.client.guilds.cache.get(guildId);
                if (!guild) return;
                if (!this.client.requestChannelManager.hasRequestChannel(guild)) return;

                try {
                    await this.client.requestChannelManager.createOrUpdatePlayerMessage(guild);
                    this.client.logger.info(`Restored request channel player message for guild ${guild.name}(${guild.id})`);
                } catch (error) {
                    this.client.logger.error(`Failed to restore request channel for guild ${guildId}:`, error);
                }
            });

        await Promise.all(restorePromises);
    }

    private async formatString(text: string): Promise<string> {
        let newText = text;

        if (text.includes("{userCount}")) {
            const users = await this.client.utils.getUserCount();

            newText = newText.replaceAll('{userCount}', users.toString());
        }
        if (text.includes("{textChannelCount}")) {
            const textChannels = await this.client.utils.getChannelCount(true);

            newText = newText.replaceAll('{textChannelCount}', textChannels.toString());
        }
        if (text.includes("{voiceChannelCount}")) {
            const voiceChannels = await this.client.utils.getChannelCount(false, true);

            newText = newText.replaceAll('{voiceChannelCount}', voiceChannels.toString());
        }
        if (text.includes("{serverCount}")) {
            const guilds = await this.client.utils.getGuildCount();

            newText = newText.replaceAll('{serverCount}', guilds.toString());
        }
        if (text.includes("{playingCount}")) {
            const playings = await this.client.utils.getPlayingCount();

            newText = newText.replaceAll('{playingCount}', playings.toString());
        }

        return newText
            .replaceAll('{prefix}', this.client.config.mainPrefix)
            .replaceAll('{username}', this.client.user?.username ?? "");
    }

    private async setPresence(random: boolean): Promise<Presence> {
        const activityNumber = random
            ? Math.floor(Math.random() * this.client.config.presenceData.activities.length)
            : 0;
        const statusNumber = random ? Math.floor(Math.random() * this.client.config.presenceData.status.length) : 0;
        const activity: {
            name: string;
            type: EnvActivityTypes;
            typeNumber: number;
        } = await Promise.all(
            this.client.config.presenceData.activities.map(async a => {
                let type = ActivityType.Playing;

                if (a.type === "Competing") type = ActivityType.Competing;
                if (a.type === "Watching") type = ActivityType.Watching;
                if (a.type === "Listening") type = ActivityType.Listening;

                return Object.assign(a, { name: await this.formatString(a.name), type: a.type, typeNumber: type });
            })
        ).then(x => x[activityNumber]);

        return this.client.user?.setPresence({
            activities: (activity as { name: string } | undefined)
                ? [
                    {
                        name: activity.name,
                        type: activity.typeNumber
                    }
                ]
                : [],
            status: this.client.config.presenceData.status[statusNumber]
        }) as Presence;
    }

    private async doPresence(): Promise<Presence | undefined> {
        try {
            return await this.setPresence(false);
        } catch (error) {
            if ((error as Error).message !== "Shards are still being spawned.") {
                this.client.logger.error(String(error));
            }
            return undefined;
        } finally {
            setInterval(async () => this.setPresence(true), this.client.config.presenceData.interval);
        }
    }
}
