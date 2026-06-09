import { clearTimeout, setTimeout } from "node:timers";
import {
    type AudioPlayerPlayingState,
    AudioPlayerStatus,
    type AudioResource,
} from "@discordjs/voice";
import {
    ActionRowBuilder,
    type APIMessageTopLevelComponent,
    ButtonBuilder,
    ButtonStyle,
    ChannelType,
    ContainerBuilder,
    type Guild,
    MediaGalleryBuilder,
    MediaGalleryItemBuilder,
    type Message,
    type MessageCreateOptions,
    type MessageEditOptions,
    MessageFlags,
    PermissionFlagsBits,
    SectionBuilder,
    SeparatorBuilder,
    type StageChannel,
    type TextChannel,
    TextDisplayBuilder,
    ThumbnailBuilder,
    type VoiceChannel,
} from "discord.js";
import { type Rawon } from "../../structures/Rawon.js";
import { type QueueSong } from "../../typings/index.js";
import { createEmbed } from "../functions/createEmbed.js";
import { formatMarkdownLink } from "../functions/formatMarkdown.js";
import { i18n__, i18n__mf } from "../functions/i18n.js";
import { formatDuration, normalizeTime } from "../functions/normalizeTime.js";
import {
    type FallbackDataManager,
    hasGetPlayerState,
    hasGetRequestChannel,
    hasSaveRequestChannel,
} from "../typeGuards.js";

type PlayerStatusGridItem = {
    label: string;
    value: string;
};

export class RequestChannelManager {
    private readonly pendingUpdates = new Map<string, NodeJS.Timeout>();
    private readonly updateDebounceMs = 500;
    private readonly permissionWarningCooldowns = new Map<string, number>();
    private readonly permissionWarningCooldownMs = 60_000;

    private static readonly supportedChannelTypes = new Set<ChannelType>([
        ChannelType.GuildText,
        ChannelType.GuildVoice,
        ChannelType.GuildStageVoice,
    ]);

    public constructor(public readonly client: Rawon) {}

    private getPlayerAccentColor(): number {
        const normalizedColor = this.client.data.botSettings.embedColor.replace(/^#/u, "");
        const parsedColor = Number.parseInt(normalizedColor, 16);

        if (!Number.isFinite(parsedColor) || parsedColor < 0 || parsedColor > 0xffffff) {
            return 0x22c9ff;
        }

        return parsedColor;
    }

    private getSafeImageUrl(url: string | null | undefined): string {
        if (typeof url === "string" && /^https?:\/\//iu.test(url)) {
            return url;
        }

        return "https://cdn.stegripe.org/images/rawon_splash.png";
    }

    private formatQueueFooter(
        count: string | number,
        duration: string,
        autoPlay: boolean,
        __: (key: string) => string,
        __mf: (key: string, values: Record<string, string | number>) => string,
    ): string {
        const autoPlayState = autoPlay ? "ON" : "OFF";
        const footerTemplate = __("requestChannel.queueFooter");

        if (footerTemplate.includes("{state}")) {
            return __mf("requestChannel.queueFooter", {
                count,
                duration,
                state: autoPlayState,
            });
        }

        const baseFooter = __mf("requestChannel.queueFooter", {
            count,
            duration,
        });

        return baseFooter;
    }

    private isPrimaryBot(): boolean {
        if (!this.client.config.isMultiBot) {
            return true;
        }

        const thisBot = this.client.multiBotManager.getBotByClient(this.client);
        return thisBot?.isPrimary ?? true;
    }

    private getPrimaryRequestChannel(
        guild: Guild,
    ): TextChannel | VoiceChannel | StageChannel | null {
        if (!this.client.config.isMultiBot || this.isPrimaryBot()) {
            return null;
        }

        const primaryBot = this.client.multiBotManager.getPrimaryBot();
        if (!primaryBot) {
            return null;
        }

        const primaryGuild = primaryBot.guilds.cache.get(guild.id);
        if (!primaryGuild) {
            return null;
        }

        return primaryBot.requestChannelManager.getRequestChannel(primaryGuild);
    }

    private isValidId(id: string | null | undefined): id is string {
        return id !== null && id !== undefined && id.length > 0;
    }

    private isSupportedRequestChannel(
        channel: Guild["channels"]["cache"] extends Map<any, infer Channel> ? Channel : never,
    ): channel is TextChannel | VoiceChannel | StageChannel {
        return RequestChannelManager.supportedChannelTypes.has(channel.type);
    }

    private getConfiguredRequestChannelId(guild: Guild): string | null {
        const botId = this.client.user?.id ?? "unknown";

        if (hasGetRequestChannel(this.client.data)) {
            return this.client.data.getRequestChannel(guild.id, botId)?.channelId ?? null;
        }

        const fallback = this.client.data as FallbackDataManager;
        return fallback.data?.[guild.id]?.requestChannel?.channelId ?? null;
    }

    private getMissingRequestChannelPermissions(
        guild: Guild,
        channel: TextChannel | VoiceChannel | StageChannel,
    ): bigint[] {
        const requiredPermissions = [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.EmbedLinks,
            PermissionFlagsBits.ReadMessageHistory,
        ];

        const botMember = guild.members.me ?? guild.members.cache.get(this.client.user?.id ?? "");
        if (!botMember) {
            return [...requiredPermissions];
        }

        const channelPermissions = channel.permissionsFor(botMember);
        if (!channelPermissions) {
            return [...requiredPermissions];
        }

        return requiredPermissions.filter((permission) => !channelPermissions.has(permission));
    }

    private formatPermissionName(permission: bigint): string {
        const flagName = Object.entries(PermissionFlagsBits).find(
            ([, value]) => value === permission,
        )?.[0];
        const spacedName = (flagName ?? "Unknown").replace(/([a-z])([A-Z])/g, "$1 $2");
        return `**\`${spacedName}\`**`;
    }

    private canSendEmbedToTextChannel(
        guild: Guild,
        channel: TextChannel | VoiceChannel | StageChannel,
    ): boolean {
        const botMember = guild.members.me ?? guild.members.cache.get(this.client.user?.id ?? "");
        if (!botMember) {
            return false;
        }

        const permissions = channel.permissionsFor(botMember);
        if (!permissions) {
            return false;
        }

        return (
            permissions.has(PermissionFlagsBits.ViewChannel) &&
            permissions.has(PermissionFlagsBits.SendMessages) &&
            permissions.has(PermissionFlagsBits.EmbedLinks)
        );
    }

    private isPermissionError(error: unknown): boolean {
        const code = (error as { code?: number }).code;
        return code === 50_001 || code === 50_013;
    }

    private shouldNotifyPermissionIssue(
        guildId: string,
        channelId: string,
        reason: string,
    ): boolean {
        const key = `${guildId}:${channelId}:${this.client.user?.id ?? "unknown"}:${reason}`;
        const now = Date.now();
        const lastNotifiedAt = this.permissionWarningCooldowns.get(key) ?? 0;

        if (now - lastNotifiedAt < this.permissionWarningCooldownMs) {
            return false;
        }

        this.permissionWarningCooldowns.set(key, now);
        return true;
    }

    private async notifyRequestChannelPermissionIssue(
        guild: Guild,
        channelId: string,
        messageText: string,
        reason: string,
    ): Promise<void> {
        if (!this.shouldNotifyPermissionIssue(guild.id, channelId, reason)) {
            return;
        }

        const fallbackChannels: Array<TextChannel | VoiceChannel | StageChannel> = [];
        if (guild.queue?.textChannel && guild.queue.textChannel.id !== channelId) {
            fallbackChannels.push(guild.queue.textChannel);
        }
        if (
            guild.systemChannel &&
            guild.systemChannel.id !== channelId &&
            !fallbackChannels.some((channel) => channel.id === guild.systemChannel?.id)
        ) {
            fallbackChannels.push(guild.systemChannel);
        }

        for (const fallbackChannel of fallbackChannels) {
            if (!this.canSendEmbedToTextChannel(guild, fallbackChannel)) {
                continue;
            }

            const sent = await fallbackChannel
                .send({
                    flags: MessageFlags.SuppressNotifications,
                    embeds: [createEmbed("error", messageText, true)],
                })
                .then(() => true)
                .catch(() => false);

            if (sent) {
                return;
            }
        }
    }

    public getRequestChannel(guild: Guild): TextChannel | VoiceChannel | StageChannel | null {
        const botId = this.client.user?.id ?? "unknown";

        if (hasGetRequestChannel(this.client.data)) {
            const data = this.client.data.getRequestChannel(guild.id, botId);
            if (this.isValidId(data?.channelId)) {
                const channel = guild.channels.cache.get(data.channelId);
                if (channel && this.isSupportedRequestChannel(channel)) {
                    return channel;
                }
            }
        }

        const fallback = this.client.data as FallbackDataManager;
        const data = fallback.data?.[guild.id]?.requestChannel;
        if (this.isValidId(data?.channelId)) {
            const channel = guild.channels.cache.get(data.channelId);
            if (channel && this.isSupportedRequestChannel(channel)) {
                return channel;
            }
        }

        const primaryChannel = this.getPrimaryRequestChannel(guild);
        if (primaryChannel) {
            return primaryChannel;
        }

        return null;
    }

    public async getPlayerMessage(guild: Guild): Promise<Message | null> {
        const botId = this.client.user?.id ?? "unknown";

        if (hasGetRequestChannel(this.client.data)) {
            const data = this.client.data.getRequestChannel(guild.id, botId);
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

        const fallback = this.client.data as FallbackDataManager;
        const data = fallback.data?.[guild.id]?.requestChannel;
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
        const botId = this.client.user?.id ?? "unknown";

        if (hasGetRequestChannel(this.client.data)) {
            const data = this.client.data.getRequestChannel(guild.id, botId);
            return this.isValidId(data?.channelId);
        }

        const fallback = this.client.data as FallbackDataManager;
        const data = fallback.data?.[guild.id]?.requestChannel;
        return this.isValidId(data?.channelId);
    }

    public async setRequestChannel(guild: Guild, channelId: string | null): Promise<void> {
        const botId = this.client.user?.id ?? "unknown";

        if (hasSaveRequestChannel(this.client.data)) {
            if (channelId === null) {
                const existingMessage = await this.getPlayerMessage(guild);
                if (existingMessage) {
                    await existingMessage.delete().catch(() => null);
                }
                await this.client.data.saveRequestChannel(guild.id, botId, null, null);
            } else {
                await this.client.data.saveRequestChannel(guild.id, botId, channelId, null);
            }
            if (typeof this.client.data.load === "function") {
                await this.client.data.load();
            }
        } else {
            const fallback = this.client.data as FallbackDataManager;
            const currentData = fallback.data ?? {};
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

            (await fallback.save?.(() => ({
                ...currentData,
                [guild.id]: guildData,
            }))) ?? Promise.resolve();
        }
    }

    public async setPlayerMessageId(guild: Guild, messageId: string | null): Promise<void> {
        const botId = this.client.user?.id ?? "unknown";

        if (hasGetRequestChannel(this.client.data) && hasSaveRequestChannel(this.client.data)) {
            const current = this.client.data.getRequestChannel(guild.id, botId);
            const channelId = current?.channelId ?? this.getRequestChannel(guild)?.id ?? null;
            await this.client.data.saveRequestChannel(guild.id, botId, channelId, messageId);
            if (typeof this.client.data.load === "function") {
                await this.client.data.load();
            }
        } else {
            const fallback = this.client.data as FallbackDataManager;
            const currentData = fallback.data ?? {};
            const guildData = currentData[guild.id] ?? {};
            const effectiveChannelId =
                guildData.requestChannel?.channelId ?? this.getRequestChannel(guild)?.id ?? null;

            guildData.requestChannel ??= { channelId: effectiveChannelId, messageId: null };
            guildData.requestChannel.channelId ??= effectiveChannelId;
            guildData.requestChannel.messageId = messageId;

            (await fallback.save?.(() => ({
                ...currentData,
                [guild.id]: guildData,
            }))) ?? Promise.resolve();
        }
    }

    public createPlayerComponents(guild: Guild): APIMessageTopLevelComponent[] {
        const queue = guild.queue;

        const botId = this.client.user?.id ?? "unknown";
        let savedState: {
            loopMode?: string;
            shuffle?: boolean;
            autoplay?: boolean;
            volume?: number;
            filters?: Record<string, boolean>;
        } | null = null;

        if (hasGetPlayerState(this.client.data)) {
            savedState = this.client.data.getPlayerState(guild.id, botId) ?? null;
        } else {
            const fallback = this.client.data as FallbackDataManager;
            savedState = fallback.data?.[guild.id]?.playerState ?? null;
        }

        const bs = this.client.data.botSettings;
        const splash = this.getSafeImageUrl(bs.requestChannelSplash);

        const __ = i18n__(this.client, guild);
        const __mf = i18n__mf(this.client, guild);
        const guildIcon = this.getSafeImageUrl(guild.iconURL({ size: 2_048 }) ?? splash);

        if (!queue || queue.songs.size === 0) {
            const savedLoopMode = savedState?.loopMode ?? "OFF";
            const savedShuffle = savedState?.shuffle ?? false;
            const savedAutoPlay = savedState?.autoplay ?? false;
            const savedVolume = savedState?.volume ?? bs.defaultVolume;

            return this.createPlayerContainer(guild, {
                imageUrl: splash,
                mainText: `### ${__("requestChannel.standby")}`,
                queueText: this.formatQueueFooter(0, "0:00", savedAutoPlay, __, __mf),
                requesterText: null,
                imageMode: "gallery",
                statusItems: [
                    {
                        label: __("requestChannel.status"),
                        value: `▶️ ${savedLoopMode}`,
                    },
                    {
                        label: __("requestChannel.shuffle"),
                        value: `🔀 ${savedShuffle ? "ON" : "OFF"}`,
                    },
                    {
                        label: __("requestChannel.volume"),
                        value: `🔊 ${savedVolume}%`,
                    },
                ],
                autoPlayItem: {
                    label: __("requestChannel.autoplay"),
                    value: savedAutoPlay ? "ON" : "OFF",
                },
                thumbnailUrl: guildIcon,
                title: __("requestChannel.title"),
            });
        }

        const res = (
            queue.player.state as
                | (AudioPlayerPlayingState & {
                      resource: AudioResource | undefined;
                  })
                | undefined
        )?.resource;
        const queueSong = res?.metadata as QueueSong | undefined;
        const fallbackQueueSong = queueSong ?? queue.songs.sortByIndex().first();
        const song = fallbackQueueSong?.song;

        const duration = song?.duration ?? 0;
        const isLive = song?.isLive === true;

        const loopModeEmoji: Record<string, string> = {
            OFF: "▶️",
            SONG: "🔂",
            QUEUE: "🔁",
        };

        const statusEmoji =
            queue.playing || queue.player.state.status !== AudioPlayerStatus.Paused ? "▶️" : "⏸️";
        const loopEmoji = loopModeEmoji[queue.loopMode] ?? "▶️";

        const hasThumbnail = (song?.thumbnail?.length ?? 0) > 0;
        const imageUrl = this.getSafeImageUrl(hasThumbnail ? song?.thumbnail : splash);

        const totalQueueDuration = queue.songs
            .map((s) => s.song.duration)
            .reduce((acc, dur) => acc + dur, 0);

        let mainText: string;
        if (song) {
            let durationLine: string;
            if (isLive) {
                durationLine = `🔴 **\`${__("requestChannel.live")}\`**`;
            } else {
                const songDurationStr = duration > 0 ? normalizeTime(duration) : "--:--";
                durationLine = `${statusEmoji} ${__("requestChannel.songDuration")}: **\`${songDurationStr}\`**`;
            }

            mainText = `### ${formatMarkdownLink(song.title, song.url)}\n\n${durationLine}`;
        } else {
            const standbyLine = `${statusEmoji} ${__("requestChannel.standby")}`;
            mainText = standbyLine;
        }

        const shuffleState = queue.shuffle ? "ON" : "OFF";

        const queueDurationStr =
            totalQueueDuration > 0 ? formatDuration(totalQueueDuration) : "0:00";
        const queueText = this.formatQueueFooter(
            queue.songs.size.toString(),
            queueDurationStr,
            queue.autoPlay,
            __,
            __mf,
        );

        return this.createPlayerContainer(guild, {
            imageUrl,
            mainText,
            queueText,
            requesterText: song
                ? `${__("requestChannel.requestedBy")}: ${fallbackQueueSong?.requester.toString() ?? __("requestChannel.unknown")}`
                : null,
            imageMode: "gallery",
            statusItems: [
                {
                    label: __("requestChannel.status"),
                    value: `${loopEmoji} ${queue.loopMode}`,
                },
                {
                    label: __("requestChannel.shuffle"),
                    value: `🔀 ${shuffleState}`,
                },
                {
                    label: __("requestChannel.volume"),
                    value: `🔊 ${queue.volume}%`,
                },
            ],
            autoPlayItem: {
                label: __("requestChannel.autoplay"),
                value: queue.autoPlay ? "ON" : "OFF",
            },
            thumbnailUrl: guildIcon,
            title: __("requestChannel.title"),
        });
    }

    private createPlayerContainer(
        guild: Guild,
        options: {
            imageUrl: string;
            mainText: string;
            queueText: string;
            requesterText: string | null;
            imageMode: "gallery" | "thumbnail";
            statusItems: [PlayerStatusGridItem, PlayerStatusGridItem, PlayerStatusGridItem];
            autoPlayItem: PlayerStatusGridItem;
            thumbnailUrl: string;
            title: string;
        },
    ): APIMessageTopLevelComponent[] {
        const [primaryControlsRow, secondaryControlsRow] = this.createPlayerButtonRows(guild);
        const statusRow = this.createPlayerStatusRow(options.statusItems, options.autoPlayItem);
        const [, , volumeStatus] = options.statusItems;
        const volumeText = `🔊 **${volumeStatus.label}:** \`${volumeStatus.value.replace(/^🔊 /u, "")}\``;
        const headerLines = [`## ${options.title}`, options.requesterText, "", volumeText].filter(
            (line): line is string => line !== null,
        );
        const container = new ContainerBuilder()
            .setAccentColor(this.getPlayerAccentColor())
            .addSectionComponents(
                new SectionBuilder()
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(headerLines.join("\n")),
                    )
                    .setThumbnailAccessory(new ThumbnailBuilder().setURL(options.thumbnailUrl)),
            )
            .addActionRowComponents(statusRow)
            .addSeparatorComponents(new SeparatorBuilder());

        if (options.imageMode === "thumbnail") {
            container.addSectionComponents(
                new SectionBuilder()
                    .addTextDisplayComponents(new TextDisplayBuilder().setContent(options.mainText))
                    .setThumbnailAccessory(new ThumbnailBuilder().setURL(options.imageUrl)),
            );
        } else {
            container
                .addTextDisplayComponents(new TextDisplayBuilder().setContent(options.mainText))
                .addMediaGalleryComponents(
                    new MediaGalleryBuilder().addItems(
                        new MediaGalleryItemBuilder().setURL(options.imageUrl),
                    ),
                );
        }

        container
            .addSeparatorComponents(new SeparatorBuilder())
            .addTextDisplayComponents(new TextDisplayBuilder().setContent(options.queueText))
            .addSeparatorComponents(new SeparatorBuilder())
            .addActionRowComponents(primaryControlsRow, secondaryControlsRow);

        return [container.toJSON() as APIMessageTopLevelComponent];
    }

    private createPlayerStatusRow(
        items: [PlayerStatusGridItem, PlayerStatusGridItem, PlayerStatusGridItem],
        autoPlayItem: PlayerStatusGridItem,
    ): ActionRowBuilder<ButtonBuilder> {
        const [loopStatus, shuffleStatus] = items;

        return new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
                .setCustomId("RC_LOOP")
                .setLabel(`${loopStatus.label}: ${loopStatus.value.replace(/^🔁 |^🔂 |^▶️ /u, "")}`)
                .setEmoji("🔁")
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId("RC_SHUFFLE")
                .setLabel(`${shuffleStatus.label}: ${shuffleStatus.value.replace(/^🔀 /u, "")}`)
                .setEmoji("🔀")
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId("RC_AUTOPLAY")
                .setLabel(`${autoPlayItem.label}: ${autoPlayItem.value}`)
                .setEmoji("♾️")
                .setStyle(ButtonStyle.Secondary),
        );
    }

    private createPlayerMessageCreateOptions(guild: Guild): MessageCreateOptions {
        return {
            flags: MessageFlags.SuppressNotifications | MessageFlags.IsComponentsV2,
            components: this.createPlayerComponents(guild),
        };
    }

    private createPlayerMessageEditOptions(guild: Guild): MessageEditOptions {
        return {
            embeds: [],
            flags: MessageFlags.IsComponentsV2,
            components: this.createPlayerComponents(guild),
        };
    }

    private createPlayerButtonRows(
        guild: Guild,
    ): [ActionRowBuilder<ButtonBuilder>, ActionRowBuilder<ButtonBuilder>] {
        const queue = guild.queue;

        const isPlaying = queue?.playing ?? false;

        const pauseResumeEmoji = isPlaying ? "⏸️" : "▶️";

        const primaryControlsRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
                .setCustomId("RC_PAUSE_RESUME")
                .setEmoji(pauseResumeEmoji)
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId("RC_SKIP").setEmoji("⏭️").setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId("RC_STOP").setEmoji("⏹️").setStyle(ButtonStyle.Danger),
        );

        const secondaryControlsRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
                .setCustomId("RC_VOL_DOWN")
                .setEmoji("🔉")
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId("RC_VOL_UP")
                .setEmoji("🔊")
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId("RC_REMOVE").setEmoji("🗑️").setStyle(ButtonStyle.Danger),
        );

        return [primaryControlsRow, secondaryControlsRow];
    }

    private hasPlayerControls(message: Message): boolean {
        return message.components.some((component) =>
            this.hasComponentCustomId(component, "RC_PAUSE_RESUME"),
        );
    }

    private hasComponentCustomId(component: unknown, customId: string): boolean {
        if (typeof component !== "object" || component === null) {
            return false;
        }

        if ("customId" in component && component.customId === customId) {
            return true;
        }

        if ("components" in component && Array.isArray(component.components)) {
            return component.components.some((child) => this.hasComponentCustomId(child, customId));
        }

        return false;
    }

    private async findPlayerMessages(
        channel: TextChannel | VoiceChannel | StageChannel,
    ): Promise<Message[]> {
        try {
            const recent = await channel.messages.fetch({ limit: 100 });
            return recent
                .filter(
                    (msg) => msg.author.id === this.client.user?.id && this.hasPlayerControls(msg),
                )
                .map((message) => message)
                .sort(
                    (a: Message, b: Message) =>
                        (b.createdTimestamp ?? b.editedTimestamp ?? 0) -
                        (a.createdTimestamp ?? a.editedTimestamp ?? 0),
                );
        } catch {
            return [];
        }
    }

    private async pruneDuplicatePlayerMessages(
        guild: Guild,
        channel: TextChannel | VoiceChannel | StageChannel,
        preferredMessage?: Message | null,
    ): Promise<Message | null> {
        const playerMessages = await this.findPlayerMessages(channel);

        const preferredOwnMessage =
            preferredMessage &&
            preferredMessage.author.id === this.client.user?.id &&
            preferredMessage.channelId === channel.id
                ? preferredMessage
                : null;

        const canonicalMessage = playerMessages[0] ?? preferredOwnMessage;
        if (!canonicalMessage) {
            return null;
        }

        const duplicateMessages = playerMessages.filter(
            (message) => message.id !== canonicalMessage.id,
        );
        if (preferredOwnMessage && preferredOwnMessage.id !== canonicalMessage.id) {
            duplicateMessages.push(preferredOwnMessage);
        }

        for (const duplicateMessage of duplicateMessages) {
            await duplicateMessage.delete().catch(() => null);
        }

        await this.setPlayerMessageId(guild, canonicalMessage.id);
        return canonicalMessage;
    }

    public async updatePlayerMessage(guild: Guild, immediate = false): Promise<void> {
        const existingTimeout = this.pendingUpdates.get(guild.id);
        if (existingTimeout) {
            clearTimeout(existingTimeout);
            this.pendingUpdates.delete(guild.id);
        }

        const performUpdate = async (): Promise<void> => {
            this.pendingUpdates.delete(guild.id);

            try {
                const isSecondary = this.client.config.isMultiBot && !this.isPrimaryBot();
                const hasActiveQueue = !!guild.queue && guild.queue.songs.size > 0;
                if (isSecondary && !hasActiveQueue) {
                    await this.deletePlayerMessage(guild);
                    return;
                }

                const configuredChannelId = this.getConfiguredRequestChannelId(guild);
                const channel = this.getRequestChannel(guild);
                if (!channel) {
                    if (configuredChannelId) {
                        const __ = i18n__(this.client, guild);
                        const botMention = this.client.user ? `<@${this.client.user.id}>` : "";
                        const prefixLine = botMention.length > 0 ? `${botMention}\n` : "";

                        await this.notifyRequestChannelPermissionIssue(
                            guild,
                            configuredChannelId,
                            `${prefixLine}<#${configuredChannelId}>\n${__("commands.music.requestChannel.noBotPermissions")}`,
                            "channel-unavailable",
                        );

                        this.client.logger.warn(
                            `[RequestChannel] ${this.client.user?.tag} cannot access configured request channel ${configuredChannelId} in guild ${guild.id}`,
                        );
                    }
                    return;
                }

                const missingPermissions = this.getMissingRequestChannelPermissions(guild, channel);
                if (missingPermissions.length > 0) {
                    const __mf = i18n__mf(this.client, guild);
                    const permissionNames = missingPermissions
                        .map((permission) => this.formatPermissionName(permission))
                        .join(", ");
                    const botMention = this.client.user ? `<@${this.client.user.id}>` : "";
                    const prefixLine = botMention.length > 0 ? `${botMention}\n` : "";

                    await this.notifyRequestChannelPermissionIssue(
                        guild,
                        channel.id,
                        `${prefixLine}<#${channel.id}>\n${__mf(
                            "commands.music.requestChannel.missingBotPermissions",
                            {
                                permissions: permissionNames,
                            },
                        )}`,
                        "missing-permissions",
                    );

                    this.client.logger.warn(
                        `[RequestChannel] ${this.client.user?.tag} missing permissions in ${channel.id}: ${permissionNames}`,
                    );
                    return;
                }

                const trackedMessage = await this.getPlayerMessage(guild).catch(() => null);
                const message = await this.pruneDuplicatePlayerMessages(
                    guild,
                    channel,
                    trackedMessage,
                );

                if (!message) {
                    if (isSecondary && hasActiveQueue) {
                        await this.createOrUpdatePlayerMessage(guild, true);
                    }

                    return;
                }

                if (message.author.id !== this.client.user?.id) {
                    this.client.logger.debug(
                        `[MultiBot] ${this.client.user?.tag} cannot edit message ${message.id} - created by ${message.author.tag}`,
                    );
                    return;
                }

                try {
                    await message.edit(this.createPlayerMessageEditOptions(guild));
                } catch (error) {
                    if (this.isPermissionError(error)) {
                        const __ = i18n__(this.client, guild);
                        const botMention = this.client.user ? `<@${this.client.user.id}>` : "";
                        const prefixLine = botMention.length > 0 ? `${botMention}\n` : "";
                        await this.notifyRequestChannelPermissionIssue(
                            guild,
                            channel.id,
                            `${prefixLine}<#${channel.id}>\n${__("commands.music.requestChannel.noBotPermissions")}`,
                            "edit-permission-error",
                        );
                    }

                    this.client.logger.debug(
                        `Failed to update player message: ${(error as Error).message}`,
                    );
                }
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

    public async createOrUpdatePlayerMessage(
        guild: Guild,
        allowCreate = false,
    ): Promise<Message | null> {
        if (this.client.config.isMultiBot && !this.isPrimaryBot()) {
            const hasActiveQueue = !!guild.queue && guild.queue.songs.size > 0;
            if (!hasActiveQueue) {
                await this.deletePlayerMessage(guild);
                return null;
            }
        }

        const configuredChannelId = this.getConfiguredRequestChannelId(guild);
        const channel = this.getRequestChannel(guild);
        if (!channel) {
            if (configuredChannelId) {
                const __ = i18n__(this.client, guild);
                const botMention = this.client.user ? `<@${this.client.user.id}>` : "";
                const prefixLine = botMention.length > 0 ? `${botMention}\n` : "";

                await this.notifyRequestChannelPermissionIssue(
                    guild,
                    configuredChannelId,
                    `${prefixLine}<#${configuredChannelId}>\n${__("commands.music.requestChannel.noBotPermissions")}`,
                    "channel-unavailable-create",
                );

                this.client.logger.warn(
                    `[RequestChannel] ${this.client.user?.tag} cannot access configured request channel ${configuredChannelId} in guild ${guild.id}`,
                );
            }
            return null;
        }

        const missingPermissions = this.getMissingRequestChannelPermissions(guild, channel);
        if (missingPermissions.length > 0) {
            const __mf = i18n__mf(this.client, guild);
            const permissionNames = missingPermissions
                .map((permission) => this.formatPermissionName(permission))
                .join(", ");
            const botMention = this.client.user ? `<@${this.client.user.id}>` : "";
            const prefixLine = botMention.length > 0 ? `${botMention}\n` : "";

            await this.notifyRequestChannelPermissionIssue(
                guild,
                channel.id,
                `${prefixLine}<#${channel.id}>\n${__mf(
                    "commands.music.requestChannel.missingBotPermissions",
                    {
                        permissions: permissionNames,
                    },
                )}`,
                "missing-permissions-create",
            );

            this.client.logger.warn(
                `[RequestChannel] ${this.client.user?.tag} missing permissions in ${channel.id}: ${permissionNames}`,
            );
            return null;
        }

        const trackedMessage = await this.getPlayerMessage(guild).catch(() => null);
        let message = await this.pruneDuplicatePlayerMessages(guild, channel, trackedMessage);

        try {
            if (message) {
                await message.edit(this.createPlayerMessageEditOptions(guild));
            } else if (allowCreate) {
                message = await channel.send(this.createPlayerMessageCreateOptions(guild));
                await this.setPlayerMessageId(guild, message.id);
            } else {
                return null;
            }
            return message;
        } catch (error) {
            if (this.isPermissionError(error)) {
                const __ = i18n__(this.client, guild);
                const botMention = this.client.user ? `<@${this.client.user.id}>` : "";
                const prefixLine = botMention.length > 0 ? `${botMention}\n` : "";
                await this.notifyRequestChannelPermissionIssue(
                    guild,
                    channel.id,
                    `${prefixLine}<#${channel.id}>\n${__("commands.music.requestChannel.noBotPermissions")}`,
                    "create-permission-error",
                );
            }

            this.client.logger.debug(
                `Failed to create/update player message: ${(error as Error).message}`,
            );
            return null;
        }
    }

    public async deletePlayerMessage(guild: Guild): Promise<void> {
        const existingMessage = await this.getPlayerMessage(guild);
        if (existingMessage) {
            await existingMessage.delete().catch(() => null);
        }

        await this.setPlayerMessageId(guild, null);
    }

    public isRequestChannel(guild: Guild, channelId: string): boolean {
        if (this.client.config.isMultiBot) {
            const bots = this.client.multiBotManager.getBotsInGuild(guild);

            for (const bot of bots) {
                const botId = bot.botId;
                if (hasGetRequestChannel(bot.client.data)) {
                    const data = bot.client.data.getRequestChannel(guild.id, botId);
                    if (data?.channelId === channelId) {
                        this.client.logger.debug(
                            `[MultiBot] ${this.client.user?.tag} checking request channel: channelId=${channelId}, isRequest=true (owned by bot ${botId})`,
                        );
                        return true;
                    }
                } else {
                    const fallback = bot.client.data as FallbackDataManager;
                    const data = fallback.data?.[guild.id]?.requestChannel;
                    if (data?.channelId === channelId) {
                        this.client.logger.debug(
                            `[MultiBot] ${this.client.user?.tag} checking request channel: channelId=${channelId}, isRequest=true (owned by bot ${botId})`,
                        );
                        return true;
                    }
                }
            }

            this.client.logger.debug(
                `[MultiBot] ${this.client.user?.tag} checking request channel: channelId=${channelId}, isRequest=false (no bot has this channel)`,
            );
            return false;
        }

        const botId = this.client.user?.id ?? "unknown";
        if (hasGetRequestChannel(this.client.data)) {
            const data = this.client.data.getRequestChannel(guild.id, botId);
            const isRequest = data?.channelId === channelId;
            this.client.logger.debug(
                `[MultiBot] ${this.client.user?.tag} checking request channel using own data: channelId=${channelId}, isRequest=${isRequest}`,
            );
            return isRequest;
        }

        const fallback = this.client.data as FallbackDataManager;
        const data = fallback.data?.[guild.id]?.requestChannel;
        const isRequest = data?.channelId === channelId;
        this.client.logger.debug(
            `[MultiBot] ${this.client.user?.tag} checking request channel using own data (JSON): channelId=${channelId}, isRequest=${isRequest}`,
        );
        return isRequest;
    }
}
