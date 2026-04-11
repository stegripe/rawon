import { setTimeout } from "node:timers";
import { joinVoiceChannel } from "@discordjs/voice";
import { ApplyOptions } from "@sapphire/decorators";
import { Events, Listener, type ListenerOptions } from "@sapphire/framework";
import {
    ChannelType,
    type EmbedBuilder,
    type Message,
    type MessageCollector,
    PermissionFlagsBits,
    type TextChannel,
    type User,
} from "discord.js";
import { type Rawon } from "../structures/Rawon.js";
import { ServerQueue } from "../structures/ServerQueue.js";
import { createEmbed } from "../utils/functions/createEmbed.js";
import { createVoiceAdapter } from "../utils/functions/createVoiceAdapter.js";
import { formatBoldCodeSpan } from "../utils/functions/formatCodeSpan.js";
import { i18n__, i18n__mf } from "../utils/functions/i18n.js";
import { searchTrack } from "../utils/handlers/GeneralUtil.js";
import { play } from "../utils/handlers/general/play.js";

const MUSIC_COMMANDS = [
    "play",
    "p",
    "add",
    "search",
    "volume",
    "vol",
    "loop",
    "repeat",
    "shuffle",
    "autoplay",
    "ap",
    "filter",
    "skip",
    "skipto",
    "pause",
    "resume",
    "stop",
    "disconnect",
    "dc",
    "remove",
    "seek",
    "nowplaying",
    "np",
    "queue",
    "q",
];

@ApplyOptions<ListenerOptions>({
    event: Events.MessageCreate,
})
export class MessageCreateListener extends Listener<typeof Events.MessageCreate> {
    private readonly processedMessages = new Map<string, number>();
    private readonly CACHE_TTL = 5000;

    private cleanupCache(): void {
        const now = Date.now();
        for (const [key, timestamp] of this.processedMessages) {
            if (now - timestamp > this.CACHE_TTL) {
                this.processedMessages.delete(key);
            }
        }
    }

    public async run(message: Message): Promise<void> {
        const client = message.client as Rawon;

        const cacheKey = `${message.id}:${client.user?.id}`;
        if (this.processedMessages.has(cacheKey)) {
            this.container.logger.debug(
                `[MessageCreate] DEDUP: ${client.user?.tag} skipping already processed message ${message.id}`,
            );
            return;
        }
        this.processedMessages.set(cacheKey, Date.now());

        if (this.processedMessages.size > 100) {
            this.cleanupCache();
        }

        this.container.debugLog.logData("info", "MESSAGE_CREATE", [
            ["Bot", client.user?.tag ?? "unknown"],
            ["ID", message.id],
            ["Guild", message.guild ? `${message.guild.name}(${message.guild.id})` : "DM"],
            [
                "Channel",
                message.channel.type === ChannelType.DM
                    ? "DM"
                    : `${message.channel.name}(${message.channel.id})`,
            ],
            ["Author", `${message.author.tag}(${message.author.id})`],
        ]);

        if (message.guild) {
            this.container.logger.debug(
                `[MultiBot] ${client.user?.tag} received messageCreate event in guild ${message.guild.id}`,
            );
        }

        this.container.logger.debug(
            `[MessageCreate] ${client.user?.tag} Processing message from ${message.author.tag}: "${message.content.slice(0, 30)}"`,
        );

        if (
            message.author.bot ||
            message.channel.type === ChannelType.DM ||
            !client.commands.isReady
        ) {
            this.container.logger.debug(
                `[MessageCreate] ${client.user?.tag} EARLY RETURN - bot:${message.author.bot}, DM:${message.channel.type === ChannelType.DM}, ready:${client.commands.isReady}`,
            );
            if (!client.commands.isReady) {
                this.container.logger.debug(
                    `[MultiBot] ${client.user?.tag} commands not ready yet, skipping`,
                );
            }
            return;
        }

        let isMentionPrefix = false;

        const guildPrefix = message.guild
            ? (client.data.data?.[message.guild.id]?.prefix ?? null)
            : null;

        const prefixList: string[] = [];
        if (guildPrefix) {
            prefixList.push(guildPrefix);
        } else {
            prefixList.push(...this.container.data.botSettings.altPrefix);
            prefixList.push(this.container.config.mainPrefix);
        }

        this.container.logger.debug(
            `[MessageCreate] ${client.user?.tag} Prefix list: ${JSON.stringify(prefixList)}, message starts with: "${message.content.slice(0, 10)}"`,
        );

        let actualPrefix = "";
        const prefixMatch = prefixList.find((pr) => {
            if (pr === "{mention}") {
                const userMention = /<@(!)?\d*?>/u.exec(message.content);
                if (userMention?.index !== 0) {
                    return false;
                }
                const user = this.getUserFromMention(userMention[0], message);
                if (user?.id === client.user?.id) {
                    isMentionPrefix = true;
                    actualPrefix = userMention[0];
                    return true;
                }
                return false;
            }
            if (message.content.startsWith(pr)) {
                actualPrefix = pr;
                return true;
            }
            return false;
        });

        this.container.logger.debug(
            `[MessageCreate] ${client.user?.tag} prefixMatch: "${prefixMatch}", actualPrefix: "${actualPrefix}", isMentionPrefix: ${isMentionPrefix}`,
        );

        const isRequestChannel =
            message.guild &&
            client.requestChannelManager.isRequestChannel(message.guild, message.channel.id);

        if (message.guild) {
            this.container.logger.debug(
                `[MultiBot] ${client.user?.tag} checking request channel: channelId=${message.channel.id}, isRequestChannel=${isRequestChannel}`,
            );
        }

        if (isRequestChannel) {
            this.container.logger.debug(
                `[MultiBot] ${client.user?.tag} received message in request channel ${message.channel.id} from ${message.author.tag}`,
            );

            if ((prefixMatch?.length ?? 0) > 0) {
                if (message.guild && this.container.config.isMultiBot) {
                    const thisBotGuild = client.guilds.cache.get(message.guild.id);
                    if (!thisBotGuild) {
                        return;
                    }

                    const cmdContent = message.content.slice(actualPrefix.length).trim();
                    const cmdName = cmdContent.split(/ +/u)[0]?.toLowerCase();
                    const isMusicCommand = cmdName && MUSIC_COMMANDS.includes(cmdName);

                    if (isMusicCommand) {
                        let member = thisBotGuild.members.cache.get(message.author.id);
                        if (!member) {
                            try {
                                const fetchedMember = await thisBotGuild.members
                                    .fetch(message.author.id)
                                    .catch(() => null);
                                if (fetchedMember) {
                                    member = fetchedMember;
                                }
                            } catch {
                                if (message.member && message.member.guild.id === thisBotGuild.id) {
                                    member = message.member;
                                }
                            }
                        }
                        if (
                            !member &&
                            message.member &&
                            message.member.guild.id === thisBotGuild.id
                        ) {
                            member = message.member;
                        }

                        const userVoiceChannelId = member?.voice.channelId ?? null;

                        this.container.logger.debug(
                            `[MultiBot] ${client.user?.tag} PRE-CHECK music command "${cmdName}" in REQUEST CHANNEL from ${message.author.tag}: ` +
                                `userVoiceChannel=${userVoiceChannelId ?? "none"}`,
                        );

                        if (userVoiceChannelId) {
                            const shouldRespond =
                                client.multiBotManager.shouldRespondToMusicCommand(
                                    client,
                                    thisBotGuild,
                                    userVoiceChannelId,
                                );

                            this.container.logger.debug(
                                `[MultiBot] ${client.user?.tag} PRE-CHECK result for music command "${cmdName}": shouldRespond=${shouldRespond}`,
                            );

                            if (!shouldRespond) {
                                this.container.logger.warn(
                                    `[MultiBot] ${client.user?.tag} ❌ BLOCKING music command "${cmdName}" in REQUEST CHANNEL from ${message.author.tag} ` +
                                        `- NOT in same voice channel (user in: ${userVoiceChannelId}). RETURNING EARLY - COMMAND WILL NOT EXECUTE!`,
                                );
                                return;
                            }

                            this.container.logger.debug(
                                `[MultiBot] ${client.user?.tag} ✅ ALLOWING music command "${cmdName}" in REQUEST CHANNEL - will proceed to command handler`,
                            );
                        } else if (!client.multiBotManager.shouldRespond(client, thisBotGuild)) {
                            this.container.logger.debug(
                                `[MultiBot] ${client.user?.tag} skipping music command in request channel - not responsible bot`,
                            );
                            return;
                        }
                    } else if (!client.multiBotManager.shouldRespond(client, thisBotGuild)) {
                        this.container.logger.debug(
                            `[MultiBot] ${client.user?.tag} skipping prefix command in request channel - not responsible bot`,
                        );
                        return;
                    }
                }

                const cmdContent = message.content.slice(actualPrefix.length).trim();
                const cmdNameFromMsg = cmdContent.split(/ +/u)[0]?.toLowerCase();
                this.container.logger.debug(
                    `[MultiBot] ${client.user?.tag} ✅ PROCEEDING to execute command "${cmdNameFromMsg}" in REQUEST CHANNEL`,
                );
                client.commands.handle(message, actualPrefix);

                setTimeout(() => {
                    void (async (): Promise<void> => {
                        try {
                            await message.delete();
                        } catch {}
                    })();
                }, 60_000);

                const textChannel = message.channel as TextChannel;
                const collector: MessageCollector = textChannel.createMessageCollector({
                    filter: (msg: Message) => msg.author.id === client.user?.id,
                    time: 30_000,
                    max: 5,
                });

                collector.on("collect", (botMsg: Message) => {
                    setTimeout(() => {
                        void (async (): Promise<void> => {
                            try {
                                await botMsg.delete();
                            } catch {}
                        })();
                    }, 60_000);
                });
                return;
            }
            this.container.logger.debug(
                `[MultiBot] ${client.user?.tag} calling handleRequestChannelMessage for ${message.author.tag}`,
            );
            await this.handleRequestChannelMessage(message);
            return;
        }

        const __mf = i18n__mf(client, message.guild);

        const mentionedBot = this.getUserFromMention(message.content, message);
        const shouldRespondToMention = mentionedBot && mentionedBot.id === client.user?.id;

        if (shouldRespondToMention) {
            let prefixToShow = guildPrefix || this.container.config.mainPrefix;
            if (!guildPrefix && this.container.config.isMultiBot) {
                const primaryBot = client.multiBotManager.getPrimaryBot();
                if (primaryBot) {
                    prefixToShow = primaryBot.config.mainPrefix;
                }
            }

            await message
                .reply({
                    embeds: [
                        createEmbed(
                            "info",
                            `👋 **|** ${__mf("events.createMessage", {
                                author: message.author.toString(),
                                prefix: formatBoldCodeSpan(prefixToShow),
                            })}`,
                        ),
                    ],
                })
                .catch((error: unknown) => this.container.logger.error("PROMISE_ERR:", error));
        }

        if ((prefixMatch?.length ?? 0) > 0) {
            if (message.guild && this.container.config.isMultiBot) {
                const thisBotGuild = client.guilds.cache.get(message.guild.id);
                if (!thisBotGuild) {
                    return;
                }

                const cmdContent = message.content.slice(actualPrefix.length).trim();
                const cmdName = cmdContent.split(/ +/u)[0]?.toLowerCase();
                const isMusicCommand = cmdName && MUSIC_COMMANDS.includes(cmdName);

                if (isMusicCommand) {
                    let member = thisBotGuild.members.cache.get(message.author.id);
                    if (!member) {
                        try {
                            const fetchedMember = await thisBotGuild.members
                                .fetch(message.author.id)
                                .catch(() => null);
                            if (fetchedMember) {
                                member = fetchedMember;
                            }
                        } catch {
                            if (message.member && message.member.guild.id === thisBotGuild.id) {
                                member = message.member;
                            }
                        }
                    }
                    if (!member && message.member && message.member.guild.id === thisBotGuild.id) {
                        member = message.member;
                    }

                    const userVoiceChannelId = member?.voice.channelId ?? null;

                    this.container.logger.debug(
                        `[MultiBot] ${client.user?.tag} checking music command "${cmdName}" from ${message.author.tag}: ` +
                            `userVoiceChannel=${userVoiceChannelId ?? "none"}, memberCached=${member !== null}`,
                    );

                    if (userVoiceChannelId) {
                        const shouldRespond = client.multiBotManager.shouldRespondToMusicCommand(
                            client,
                            thisBotGuild,
                            userVoiceChannelId,
                        );

                        if (!shouldRespond) {
                            this.container.logger.warn(
                                `[MultiBot] ${client.user?.tag} ❌ BLOCKING music command "${cmdName}" from ${message.author.tag} ` +
                                    `- NOT in same voice channel (user in: ${userVoiceChannelId}). ` +
                                    `RETURNING EARLY - COMMAND WILL NOT BE EXECUTED!`,
                            );
                            return;
                        }
                        this.container.logger.debug(
                            `[MultiBot] ${client.user?.tag} ALLOWING music command "${cmdName}" from ${message.author.tag} - in same voice channel (${userVoiceChannelId})`,
                        );
                    } else if (
                        !isMentionPrefix &&
                        !client.multiBotManager.shouldRespond(client, thisBotGuild)
                    ) {
                        this.container.logger.debug(
                            `[MultiBot] ${client.user?.tag} skipping music command "${cmdName}" - user not in voice and not responsible bot`,
                        );
                        return;
                    }
                } else if (
                    !isMentionPrefix &&
                    !client.multiBotManager.shouldRespond(client, thisBotGuild)
                ) {
                    this.container.logger.debug(
                        `[MultiBot] ${client.user?.tag} skipping prefix command "${cmdName}" - not responsible bot`,
                    );
                    return;
                }
            }
            this.container.logger.debug(
                `[MessageCreate] Calling commands.handle() for message "${message.content.slice(0, 30)}" with prefix "${actualPrefix}"`,
            );
            client.commands.handle(message, actualPrefix);
        }
    }

    private async handleRequestChannelMessage(message: Message): Promise<void> {
        const client = message.client as Rawon;

        if (!message.guild) {
            return;
        }

        const thisBotGuild = client.guilds.cache.get(message.guild.id);
        if (!thisBotGuild) {
            this.container.logger.warn(
                `[MultiBot] ${client.user?.tag} cannot find guild ${message.guild.id} in its own cache`,
            );
            return;
        }

        const guild = thisBotGuild;

        const __ = i18n__(client, guild);
        const __mf = i18n__mf(client, guild);

        this.container.logger.debug(
            `[MultiBot] ${client.user?.tag} received request in channel ${message.channel.id} from ${message.author.tag}`,
        );

        setTimeout(() => {
            void (async (): Promise<void> => {
                try {
                    await message.delete();
                } catch {}
            })();
        }, 60_000);

        const query = message.content.trim();
        if (query.length === 0) {
            return;
        }

        const isSearchSelection =
            /^(?:[1-9]|10)(?:\s*,\s*(?:[1-9]|10))*$/u.test(query) ||
            ["c", "cancel"].includes(query.toLowerCase());
        if (isSearchSelection) {
            return;
        }

        const member = message.member;
        if (!member) {
            return;
        }

        const voiceChannel = member.voice.channel;
        if (!voiceChannel) {
            this.sendTemporaryReply(message, createEmbed("warn", __("requestChannel.notInVoice")));
            return;
        }

        const shouldHandle = client.multiBotManager.shouldRespondToVoice(
            client,
            guild,
            voiceChannel.id,
        );

        if (!shouldHandle) {
            const responsibleBot = client.multiBotManager.getBotForVoiceChannel(
                guild,
                voiceChannel.id,
            );
            this.container.logger.debug(
                `[MultiBot] ${client.user?.tag} SKIPPING voice channel ${voiceChannel.id} (${voiceChannel.name}) - responsible bot: ${responsibleBot?.user?.tag ?? "none"}`,
            );

            if (responsibleBot && responsibleBot !== client) {
                const missingPermissions = this.getMissingRequestChannelPermissionsForBot(
                    responsibleBot,
                    guild.id,
                    message.channel.id,
                );

                if (missingPermissions.length > 0) {
                    this.container.logger.warn(
                        `[MultiBot] ${client.user?.tag} detected responsible bot ${responsibleBot.user?.tag ?? responsibleBot.user?.id ?? "unknown"} missing request-channel permissions in ${message.channel.id}: ${missingPermissions
                            .map((perm) => this.formatPermissionName(perm))
                            .join(", ")}`,
                    );

                    const permissionNames = missingPermissions
                        .map((perm) => this.formatPermissionName(perm))
                        .join(", ");
                    const responsibleMention = responsibleBot.user
                        ? `<@${responsibleBot.user.id}>`
                        : "";
                    const prefixLine =
                        responsibleMention.length > 0 ? `${responsibleMention}\n` : "";

                    this.sendTemporaryReply(
                        message,
                        createEmbed(
                            "error",
                            `${prefixLine}${__mf(
                                "commands.music.requestChannel.missingBotPermissions",
                                {
                                    permissions: permissionNames,
                                },
                            )}`,
                            true,
                        ),
                    );
                }
            }

            return;
        }

        this.container.logger.info(
            `[MultiBot] ${client.user?.tag} PROCESSING voice channel ${voiceChannel.id} (${voiceChannel.name}) for request from ${message.author.tag}`,
        );

        const songs = await searchTrack(client, query).catch((error: unknown) => {
            client.logger.error("[RequestChannel] searchTrack failed:", error);
            return null;
        });
        if (!songs || songs.items.length === 0) {
            this.sendTemporaryReply(
                message,
                createEmbed("error", __("requestChannel.noResults"), true),
            );
            return;
        }

        const wasIdle = guild.queue?.idle ?? false;

        const existingQueueChannel = guild.queue?.connection?.joinConfig.channelId;
        const isNewQueue =
            !guild.queue ||
            (existingQueueChannel !== undefined && existingQueueChannel !== voiceChannel.id);

        if (
            !guild.queue ||
            (existingQueueChannel !== undefined && existingQueueChannel !== voiceChannel.id)
        ) {
            if (guild.queue && existingQueueChannel !== voiceChannel.id) {
                this.container.logger.info(
                    `[MultiBot] ${client.user?.tag} destroying queue for channel ${existingQueueChannel} to create new queue for channel ${voiceChannel.id}`,
                );
                await guild.queue.destroy();
            }

            const queueChannel = guild.channels.cache.get(message.channel.id);
            if (!queueChannel?.isTextBased()) {
                this.container.logger.error(
                    `[MultiBot] ${client.user?.tag} cannot find message-capable channel ${message.channel.id} in own guild`,
                );
                return;
            }

            guild.queue = new ServerQueue(queueChannel as TextChannel);

            try {
                const adapterCreator = createVoiceAdapter(client, guild.id);

                this.container.logger.info(
                    `[MultiBot] ${client.user?.tag} creating voice connection for channel ${voiceChannel.id} (${voiceChannel.name}) using custom adapter`,
                );

                const connection = joinVoiceChannel({
                    adapterCreator,
                    channelId: voiceChannel.id,
                    guildId: guild.id,
                    selfDeaf: true,
                    group: client.user?.id ?? "default",
                }).on("debug", (debugMessage) => {
                    this.container.logger.debug(`[VOICE] ${debugMessage}`);
                });

                guild.queue.connection = connection;
                this.container.logger.info(
                    `[MultiBot] ${client.user?.tag} joined voice channel ${voiceChannel.id} (${voiceChannel.name})`,
                );
            } catch (error) {
                guild.queue?.songs.clear();
                delete guild.queue;

                this.sendTemporaryReply(
                    message,
                    createEmbed(
                        "error",
                        __mf("utils.generalHandler.errorJoining", {
                            message: `\`${(error as Error).message}\``,
                        }),
                        true,
                    ),
                );
                return;
            }
        }

        for (const song of songs.type === "results" ? songs.items : [songs.items[0]]) {
            guild.queue.songs.addSong(song, member);
        }
        if (isNewQueue || wasIdle) {
            void play(guild);
        } else {
            await client.requestChannelManager.updatePlayerMessage(guild);
        }

        let confirmEmbed: EmbedBuilder;
        if (songs.playlist) {
            const playlistTitle = songs.playlist.title;
            const playlistUrl = songs.playlist.url;
            confirmEmbed = createEmbed(
                "success",
                `🎶 **|** ${__mf("requestChannel.addedPlaylistToQueue", {
                    playlist: `**[${playlistTitle}](${playlistUrl})**`,
                    count: `**\`${songs.items.length.toString()}\`**`,
                })}`,
            );
            if (songs.playlist.thumbnail) {
                confirmEmbed.setThumbnail(songs.playlist.thumbnail);
            }
            if (songs.playlist.author) {
                confirmEmbed.setFooter({ text: `📁 ${songs.playlist.author}` });
            }
        } else {
            const songTitle = songs.items[0].title;
            const songUrl = songs.items[0].url;
            confirmEmbed = createEmbed(
                "success",
                `🎶 **|** ${__mf("requestChannel.addedToQueue", {
                    song: `**[${songTitle}](${songUrl})**`,
                })}`,
            );
            if (songs.items[0].thumbnail) {
                confirmEmbed.setThumbnail(songs.items[0].thumbnail);
            }
        }
        this.sendTemporaryReply(message, confirmEmbed);
    }

    private sendTemporaryReply(message: Message, embed: ReturnType<typeof createEmbed>): void {
        void (async () => {
            let msg: Message | null = null;

            try {
                msg = await message.reply({
                    embeds: [embed],
                    allowedMentions: { repliedUser: false },
                });
            } catch (error) {
                if (this.isPermissionLikeError(error)) {
                    await this.notifyPermissionFallback(message);
                    this.container.logger.warn(
                        `[RequestChannel] Failed to send temporary reply in ${message.channel.id} due to missing permissions`,
                    );
                } else {
                    this.container.logger.debug(
                        `[RequestChannel] Failed to send temporary reply in ${message.channel.id}: ${(error as Error).message}`,
                    );
                }
            }

            if (msg) {
                setTimeout(() => {
                    void (async () => {
                        try {
                            await msg.delete();
                        } catch {}
                    })();
                }, 60_000);
            }
        })();
    }

    private isPermissionLikeError(error: unknown): boolean {
        const code = (error as { code?: number })?.code;
        if (code === 50_013 || code === 50_001) {
            return true;
        }

        const message = (error as Error)?.message?.toLowerCase() ?? "";
        return message.includes("missing permissions") || message.includes("missing access");
    }

    private formatPermissionName(permission: bigint): string {
        const flagName = Object.entries(PermissionFlagsBits).find(
            ([, value]) => value === permission,
        )?.[0];
        const spacedName = (flagName ?? "Unknown").replace(/([a-z])([A-Z])/g, "$1 $2");
        return `**\`${spacedName}\`**`;
    }

    private getMissingReplyPermissions(message: Message): bigint[] {
        if (!message.guild) {
            return [];
        }

        const requiredPermissions = [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.EmbedLinks,
            PermissionFlagsBits.ReadMessageHistory,
        ];

        const botMember =
            message.guild.members.me ??
            message.guild.members.cache.get(message.client.user?.id ?? "");
        if (!botMember) {
            return [...requiredPermissions];
        }

        if (!("permissionsFor" in message.channel)) {
            return [...requiredPermissions];
        }

        const permissions = message.channel.permissionsFor(botMember);
        if (!permissions) {
            return [...requiredPermissions];
        }

        return requiredPermissions.filter((permission) => !permissions.has(permission));
    }

    private async notifyPermissionFallback(message: Message): Promise<void> {
        if (!message.guild) {
            return;
        }

        const client = message.client as Rawon;
        const __mf = i18n__mf(client, message.guild);

        const missingPermissions = this.getMissingReplyPermissions(message);
        const permissionNames = missingPermissions
            .map((permission) => this.formatPermissionName(permission))
            .join(", ");
        const fallbackPermissions = [
            this.formatPermissionName(PermissionFlagsBits.ViewChannel),
            this.formatPermissionName(PermissionFlagsBits.SendMessages),
            this.formatPermissionName(PermissionFlagsBits.EmbedLinks),
        ].join(", ");

        const messageText = __mf("utils.commonUtil.botMissingChannelPerms", {
            channel: `<#${message.channel.id}>`,
            permissions: permissionNames.length > 0 ? permissionNames : fallbackPermissions,
        });

        await message.author
            .send({
                embeds: [createEmbed("error", messageText, true)],
            })
            .catch(() => null);
    }

    private getMissingRequestChannelPermissionsForBot(
        botClient: Rawon,
        guildId: string,
        channelId: string,
    ): bigint[] {
        const requiredPermissions = [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.EmbedLinks,
            PermissionFlagsBits.ReadMessageHistory,
        ];

        const botGuild = botClient.guilds.cache.get(guildId);
        if (!botGuild) {
            return [...requiredPermissions];
        }

        const botMember =
            botGuild.members.me ?? botGuild.members.cache.get(botClient.user?.id ?? "");
        if (!botMember) {
            return [...requiredPermissions];
        }

        const channel = botGuild.channels.cache.get(channelId);
        if (
            !channel ||
            ![ChannelType.GuildText, ChannelType.GuildVoice, ChannelType.GuildStageVoice].includes(
                channel.type,
            )
        ) {
            return [PermissionFlagsBits.ViewChannel];
        }

        const botPermissions = channel.permissionsFor(botMember);
        if (!botPermissions) {
            return [...requiredPermissions];
        }

        return requiredPermissions.filter((perm) => !botPermissions.has(perm));
    }

    private getUserFromMention(mention: string, message: Message): User | undefined {
        const client = message.client as Rawon;
        const matches = /^<@!?(\d+)>$/u.exec(mention);
        if (!matches) {
            return undefined;
        }

        const id = matches[1];
        return client.users.cache.get(id);
    }
}
