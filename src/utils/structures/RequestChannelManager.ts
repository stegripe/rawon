import { clearTimeout, setTimeout } from "node:timers";
import { type AudioPlayerPlayingState, type AudioResource } from "@discordjs/voice";
import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ChannelType,
    type EmbedBuilder,
    type Guild,
    type Message,
    type TextChannel,
} from "discord.js";
import i18n, { requestChannelSplash } from "../../config/index.js";
import { type Rawon } from "../../structures/Rawon.js";
import { type QueueSong } from "../../typings/index.js";
import { createEmbed } from "../functions/createEmbed.js";
import { normalizeTime } from "../functions/normalizeTime.js";

export class RequestChannelManager {
    private readonly pendingUpdates = new Map<string, NodeJS.Timeout>();
    private readonly updateDebounceMs = 500;

    public constructor(public readonly client: Rawon) {}

    private isValidId(id: string | null | undefined): id is string {
        return id !== null && id !== undefined && id.length > 0;
    }

    public getRequestChannel(guild: Guild): TextChannel | null {
        const data = this.client.data.data?.[guild.id]?.requestChannel;
        if (!this.isValidId(data?.channelId)) {
            return null;
        }

        const channel = guild.channels.cache.get(data.channelId);
        if (!channel || channel.type !== ChannelType.GuildText) {
            return null;
        }

        return channel;
    }

    public async getPlayerMessage(guild: Guild): Promise<Message | null> {
        const data = this.client.data.data?.[guild.id]?.requestChannel;
        if (!this.isValidId(data?.channelId)) {
            return null;
        }
        if (!this.isValidId(data?.messageId)) {
            return null;
        }

        const channel = this.getRequestChannel(guild);
        if (!channel) {
            return null;
        }

        try {
            return await channel.messages.fetch(data.messageId);
        } catch {
            return null;
        }
    }

    public hasRequestChannel(guild: Guild): boolean {
        const data = this.client.data.data?.[guild.id]?.requestChannel;
        return this.isValidId(data?.channelId);
    }

    public async setRequestChannel(guild: Guild, channelId: string | null): Promise<void> {
        const currentData = this.client.data.data ?? {};
        const guildData = currentData[guild.id] ?? {};

        if (channelId === null) {
            const existingMessage = await this.getPlayerMessage(guild);
            if (existingMessage) {
                await existingMessage.delete().catch(() => null);
            }
            guildData.requestChannel = { channelId: null, messageId: null };
        } else {
            guildData.requestChannel = { channelId, messageId: null };
        }

        await this.client.data.save(() => ({
            ...currentData,
            [guild.id]: guildData,
        }));
    }

    public async setPlayerMessageId(guild: Guild, messageId: string | null): Promise<void> {
        const currentData = this.client.data.data ?? {};
        const guildData = currentData[guild.id] ?? {};

        guildData.requestChannel ??= { channelId: null, messageId: null };
        guildData.requestChannel.messageId = messageId;

        await this.client.data.save(() => ({
            ...currentData,
            [guild.id]: guildData,
        }));
    }

    public createPlayerEmbed(guild: Guild): EmbedBuilder {
        const queue = guild.queue;
        const savedState = this.client.data.data?.[guild.id]?.playerState;

        if (!queue || queue.songs.size === 0) {
            const savedLoopMode = savedState?.loopMode ?? "OFF";
            const savedShuffle = savedState?.shuffle ?? false;
            const savedVolume = savedState?.volume ?? 100;

            return createEmbed("info", i18n.__("requestChannel.standby"))
                .setTitle(`🎵  ${i18n.__("requestChannel.title")}`)
                .setImage(requestChannelSplash)
                .addFields([
                    {
                        name: i18n.__("requestChannel.status"),
                        value: `▶️ ${savedLoopMode}`,
                        inline: true,
                    },
                    {
                        name: i18n.__("requestChannel.shuffle"),
                        value: `🔀 ${savedShuffle ? "ON" : "OFF"}`,
                        inline: true,
                    },
                    {
                        name: i18n.__("requestChannel.volume"),
                        value: `🔊 ${savedVolume}%`,
                        inline: true,
                    },
                ])
                .setFooter({ text: i18n.__mf("requestChannel.queueFooter", { count: 0 }) });
        }

        const res = (
            queue.player.state as
                | (AudioPlayerPlayingState & {
                      resource: AudioResource | undefined;
                  })
                | undefined
        )?.resource;
        const queueSong = res?.metadata as QueueSong | undefined;
        const song = queueSong?.song;

        const duration = song?.duration ?? 0;
        const isLive = song?.isLive === true;

        const loopModeEmoji: Record<string, string> = {
            OFF: "▶️",
            SONG: "🔂",
            QUEUE: "🔁",
        };

        const statusEmoji = queue.playing ? "▶️" : "⏸️";
        const loopEmoji = loopModeEmoji[queue.loopMode] ?? "▶️";

        const hasThumbnail = (song?.thumbnail?.length ?? 0) > 0;
        const imageUrl = hasThumbnail ? song?.thumbnail : requestChannelSplash;

        const embed = createEmbed("info")
            .setTitle(`🎵  ${i18n.__("requestChannel.title")}`)
            .setImage(imageUrl ?? requestChannelSplash);

        const guildIcon = guild.iconURL({ size: 2_048 });
        if (guildIcon !== null && guildIcon.length > 0) {
            embed.setThumbnail(guildIcon);
        }

        // Calculate total queue duration
        const totalQueueDuration = queue.songs
            .map((s) => s.song.duration)
            .reduce((acc, dur) => acc + dur, 0);

        if (song) {
            let durationLine: string;
            if (isLive) {
                durationLine = `🔴 **\`${i18n.__("requestChannel.live")}\`**`;
            } else {
                const songDurationStr = duration > 0 ? normalizeTime(duration) : "--:--";
                const queueDurationStr =
                    totalQueueDuration > 0 ? normalizeTime(totalQueueDuration) : "--:--";
                durationLine = `${statusEmoji} ${i18n.__("requestChannel.songDuration")}: **\`${songDurationStr}\`** • ${i18n.__("requestChannel.queueDuration")}: **\`${queueDurationStr}\`**`;
            }

            embed.setDescription(
                `### **[${song.title}](${song.url})**\n\n` +
                    `${durationLine}\n\n` +
                    `${i18n.__("requestChannel.requestedBy")}: ${queueSong?.requester.toString() ?? i18n.__("requestChannel.unknown")}`,
            );
        } else {
            embed.setDescription(`${statusEmoji} ${i18n.__("requestChannel.standby")}`);
        }

        const shuffleState = queue.shuffle ? "ON" : "OFF";
        embed.addFields([
            {
                name: i18n.__("requestChannel.status"),
                value: `${loopEmoji} ${queue.loopMode}`,
                inline: true,
            },
            { name: i18n.__("requestChannel.shuffle"), value: `🔀 ${shuffleState}`, inline: true },
            { name: i18n.__("requestChannel.volume"), value: `🔊 ${queue.volume}%`, inline: true },
        ]);
        embed.setFooter({
            text: i18n.__mf("requestChannel.queueFooter", { count: queue.songs.size.toString() }),
        });

        return embed;
    }

    public createPlayerButtons(guild: Guild): ActionRowBuilder<ButtonBuilder>[] {
        const queue = guild.queue;
        const isPlaying = queue?.playing ?? false;

        const pauseResumeEmoji = isPlaying ? "⏸️" : "▶️";

        const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
                .setCustomId("RC_PAUSE_RESUME")
                .setEmoji(pauseResumeEmoji)
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId("RC_SKIP").setEmoji("⏭️").setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId("RC_STOP").setEmoji("⏹️").setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
                .setCustomId("RC_LOOP")
                .setEmoji("🔁")
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId("RC_SHUFFLE")
                .setEmoji("🔀")
                .setStyle(ButtonStyle.Secondary),
        );

        const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
                .setCustomId("RC_VOL_DOWN")
                .setEmoji("🔉")
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId("RC_VOL_UP")
                .setEmoji("🔊")
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId("RC_REMOVE").setEmoji("🗑️").setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
                .setCustomId("RC_QUEUE_LIST")
                .setEmoji("📋")
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId("RC_FILTER")
                .setEmoji("🎛️")
                .setStyle(ButtonStyle.Secondary),
        );

        return [row1, row2];
    }

    public async updatePlayerMessage(guild: Guild, immediate = false): Promise<void> {
        const existingTimeout = this.pendingUpdates.get(guild.id);
        if (existingTimeout) {
            clearTimeout(existingTimeout);
            this.pendingUpdates.delete(guild.id);
        }

        const performUpdate = async (): Promise<void> => {
            this.pendingUpdates.delete(guild.id);
            const message = await this.getPlayerMessage(guild).catch(() => null);
            if (!message) {
                return;
            }

            try {
                const embed = this.createPlayerEmbed(guild);
                const components = this.createPlayerButtons(guild);
                await message
                    .edit({
                        embeds: [embed],
                        components,
                    })
                    .catch((error: unknown) => {
                        this.client.logger.debug(
                            `Failed to update player message: ${(error as Error).message}`,
                        );
                    });
            } catch (error) {
                this.client.logger.debug(
                    `Error in updatePlayerMessage: ${(error as Error).message}`,
                );
            }
        };

        if (immediate) {
            await performUpdate();
        } else {
            const timeout = setTimeout(() => {
                void performUpdate();
            }, this.updateDebounceMs);
            this.pendingUpdates.set(guild.id, timeout);
        }
    }

    public async createOrUpdatePlayerMessage(guild: Guild): Promise<Message | null> {
        const channel = this.getRequestChannel(guild);
        if (!channel) {
            return null;
        }

        let message = await this.getPlayerMessage(guild);

        try {
            if (message) {
                await message.edit({
                    embeds: [this.createPlayerEmbed(guild)],
                    components: this.createPlayerButtons(guild),
                });
            } else {
                message = await channel.send({
                    embeds: [this.createPlayerEmbed(guild)],
                    components: this.createPlayerButtons(guild),
                });
                await this.setPlayerMessageId(guild, message.id);
            }
            return message;
        } catch {
            return null;
        }
    }

    public isRequestChannel(guild: Guild, channelId: string): boolean {
        const data = this.client.data.data?.[guild.id]?.requestChannel;
        return data?.channelId === channelId;
    }
}
