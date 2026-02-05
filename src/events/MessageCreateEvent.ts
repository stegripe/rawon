import { setTimeout } from "node:timers";
import { joinVoiceChannel } from "@discordjs/voice";
import {
    ChannelType,
    type EmbedBuilder,
    type Message,
    type MessageCollector,
    type TextChannel,
    type User,
} from "discord.js";
import { BaseEvent } from "../structures/BaseEvent.js";
import { ServerQueue } from "../structures/ServerQueue.js";
import { Event } from "../utils/decorators/Event.js";
import { createEmbed } from "../utils/functions/createEmbed.js";
import { createVoiceAdapter } from "../utils/functions/createVoiceAdapter.js";
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

@Event<typeof MessageCreateEvent>("messageCreate")
export class MessageCreateEvent extends BaseEvent {
    public async execute(message: Message): Promise<void> {
        this.client.debugLog.logData("info", "MESSAGE_CREATE", [
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
            this.client.logger.debug(
                `[MultiBot] ${this.client.user?.tag} received messageCreate event in guild ${message.guild.id}`,
            );
        }

        if (
            message.author.bot ||
            message.channel.type === ChannelType.DM ||
            !this.client.commands.isReady
        ) {
            if (!this.client.commands.isReady) {
                this.client.logger.debug(
                    `[MultiBot] ${this.client.user?.tag} commands not ready yet, skipping`,
                );
            }
            return;
        }

        let isMentionPrefix = false;

        const guildPrefix = message.guild
            ? (this.client.data.data?.[message.guild.id]?.prefix ?? null)
            : null;

        const prefixList: string[] = [];
        if (guildPrefix) {
            prefixList.push(guildPrefix);
        } else {
            prefixList.push(...this.client.config.altPrefixes);
            prefixList.push(this.client.config.mainPrefix);
        }

        const prefixMatch = prefixList.find((pr) => {
            if (pr === "{mention}") {
                const userMention = /<@(!)?\d*?>/u.exec(message.content);
                if (userMention?.index !== 0) {
                    return false;
                }
                const user = this.getUserFromMention(userMention[0]);
                if (user?.id === this.client.user?.id) {
                    isMentionPrefix = true;
                    return true;
                }
                return false;
            }
            return message.content.startsWith(pr);
        });

        const isRequestChannel =
            message.guild &&
            this.client.requestChannelManager.isRequestChannel(message.guild, message.channel.id);

        if (message.guild) {
            this.client.logger.debug(
                `[MultiBot] ${this.client.user?.tag} checking request channel: channelId=${message.channel.id}, isRequestChannel=${isRequestChannel}`,
            );
        }

        if (isRequestChannel) {
            this.client.logger.debug(
                `[MultiBot] ${this.client.user?.tag} received message in request channel ${message.channel.id} from ${message.author.tag}`,
            );

            if ((prefixMatch?.length ?? 0) > 0) {
                if (message.guild && this.client.config.isMultiBot) {
                    const thisBotGuild = this.client.guilds.cache.get(message.guild.id);
                    if (!thisBotGuild) {
                        return;
                    }

                    const prefix = prefixMatch || "";
                    const cmdContent = message.content.slice(prefix.length).trim();
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

                        this.client.logger.info(
                            `[MultiBot] ${this.client.user?.tag} PRE-CHECK music command "${cmdName}" in REQUEST CHANNEL from ${message.author.tag}: ` +
                                `userVoiceChannel=${userVoiceChannelId ?? "none"}`,
                        );

                        if (userVoiceChannelId) {
                            const shouldRespond =
                                this.client.multiBotManager.shouldRespondToMusicCommand(
                                    this.client,
                                    thisBotGuild,
                                    userVoiceChannelId,
                                );

                            this.client.logger.info(
                                `[MultiBot] ${this.client.user?.tag} PRE-CHECK result for music command "${cmdName}": shouldRespond=${shouldRespond}`,
                            );

                            if (!shouldRespond) {
                                this.client.logger.warn(
                                    `[MultiBot] ${this.client.user?.tag} ❌ BLOCKING music command "${cmdName}" in REQUEST CHANNEL from ${message.author.tag} ` +
                                        `- NOT in same voice channel (user in: ${userVoiceChannelId}). RETURNING EARLY - COMMAND WILL NOT EXECUTE!`,
                                );
                                return;
                            }

                            this.client.logger.info(
                                `[MultiBot] ${this.client.user?.tag} ✅ ALLOWING music command "${cmdName}" in REQUEST CHANNEL - will proceed to command handler`,
                            );
                        } else if (
                            !this.client.multiBotManager.shouldRespond(this.client, thisBotGuild)
                        ) {
                            this.client.logger.debug(
                                `[MultiBot] ${this.client.user?.tag} skipping music command in request channel - not responsible bot`,
                            );
                            return;
                        }
                    } else if (
                        !this.client.multiBotManager.shouldRespond(this.client, thisBotGuild)
                    ) {
                        this.client.logger.debug(
                            `[MultiBot] ${this.client.user?.tag} skipping prefix command in request channel - not responsible bot`,
                        );
                        return;
                    }
                }

                const prefix = prefixMatch || "";
                const cmdContent = message.content.slice(prefix.length).trim();
                const cmdNameFromMsg = cmdContent.split(/ +/u)[0]?.toLowerCase();
                this.client.logger.info(
                    `[MultiBot] ${this.client.user?.tag} ✅ PROCEEDING to execute command "${cmdNameFromMsg}" in REQUEST CHANNEL`,
                );
                this.client.commands.handle(message, prefixMatch as unknown as string);

                setTimeout(() => {
                    void (async (): Promise<void> => {
                        try {
                            await message.delete();
                        } catch {
                            // Ignore errors
                        }
                    })();
                }, 60_000);

                const textChannel = message.channel as TextChannel;
                const collector: MessageCollector = textChannel.createMessageCollector({
                    filter: (msg: Message) => msg.author.id === this.client.user?.id,
                    time: 10_000,
                    max: 1,
                });

                collector.on("collect", (botMsg: Message) => {
                    setTimeout(() => {
                        void (async (): Promise<void> => {
                            try {
                                await botMsg.delete();
                            } catch {
                                // Ignore errors
                            }
                        })();
                    }, 60_000);
                });
                return;
            }
            this.client.logger.debug(
                `[MultiBot] ${this.client.user?.tag} calling handleRequestChannelMessage for ${message.author.tag}`,
            );
            await this.handleRequestChannelMessage(message);
            return;
        }

        const __mf = i18n__mf(this.client, message.guild);

        const mentionedBot = this.getUserFromMention(message.content);
        const shouldRespondToMention = mentionedBot && mentionedBot.id === this.client.user?.id;

        if (shouldRespondToMention) {
            let prefixToShow = this.client.config.mainPrefix;
            if (this.client.config.isMultiBot) {
                const primaryBot = this.client.multiBotManager.getPrimaryBot();
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
                                prefix: `**\`${prefixToShow}\`**`,
                            })}`,
                        ),
                    ],
                })
                .catch((error: unknown) => this.client.logger.error("PROMISE_ERR:", error));
        }

        if ((prefixMatch?.length ?? 0) > 0) {
            if (message.guild && this.client.config.isMultiBot) {
                const thisBotGuild = this.client.guilds.cache.get(message.guild.id);
                if (!thisBotGuild) {
                    return;
                }

                const prefix = prefixMatch || "";
                const cmdContent = message.content.slice(prefix.length).trim();
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

                    this.client.logger.debug(
                        `[MultiBot] ${this.client.user?.tag} checking music command "${cmdName}" from ${message.author.tag}: ` +
                            `userVoiceChannel=${userVoiceChannelId ?? "none"}, memberCached=${member !== null}`,
                    );

                    if (userVoiceChannelId) {
                        const shouldRespond =
                            this.client.multiBotManager.shouldRespondToMusicCommand(
                                this.client,
                                thisBotGuild,
                                userVoiceChannelId,
                            );

                        if (!shouldRespond) {
                            this.client.logger.warn(
                                `[MultiBot] ${this.client.user?.tag} ❌ BLOCKING music command "${cmdName}" from ${message.author.tag} ` +
                                    `- NOT in same voice channel (user in: ${userVoiceChannelId}). ` +
                                    `RETURNING EARLY - COMMAND WILL NOT BE EXECUTED!`,
                            );
                            return;
                        }
                        this.client.logger.info(
                            `[MultiBot] ${this.client.user?.tag} ALLOWING music command "${cmdName}" from ${message.author.tag} - in same voice channel (${userVoiceChannelId})`,
                        );
                    } else if (
                        !isMentionPrefix &&
                        !this.client.multiBotManager.shouldRespond(this.client, thisBotGuild)
                    ) {
                        this.client.logger.debug(
                            `[MultiBot] ${this.client.user?.tag} skipping music command "${cmdName}" - user not in voice and not responsible bot`,
                        );
                        return;
                    }
                } else if (
                    !isMentionPrefix &&
                    !this.client.multiBotManager.shouldRespond(this.client, thisBotGuild)
                ) {
                    this.client.logger.debug(
                        `[MultiBot] ${this.client.user?.tag} skipping prefix command "${cmdName}" - not responsible bot`,
                    );
                    return;
                }
            }
            this.client.commands.handle(message, prefixMatch as unknown as string);
        }
    }

    private async handleRequestChannelMessage(message: Message): Promise<void> {
        if (!message.guild) {
            return;
        }

        const thisBotGuild = this.client.guilds.cache.get(message.guild.id);
        if (!thisBotGuild) {
            this.client.logger.warn(
                `[MultiBot] ${this.client.user?.tag} cannot find guild ${message.guild.id} in its own cache`,
            );
            return;
        }

        const guild = thisBotGuild;

        const __ = i18n__(this.client, guild);
        const __mf = i18n__mf(this.client, guild);

        this.client.logger.debug(
            `[MultiBot] ${this.client.user?.tag} received request in channel ${message.channel.id} from ${message.author.tag}`,
        );

        setTimeout(() => {
            void (async (): Promise<void> => {
                try {
                    await message.delete();
                } catch {
                    // Ignore errors
                }
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

        const shouldHandle = this.client.multiBotManager.shouldRespondToVoice(
            this.client,
            guild,
            voiceChannel.id,
        );

        if (!shouldHandle) {
            const responsibleBot = this.client.multiBotManager.getBotForVoiceChannel(
                guild,
                voiceChannel.id,
            );
            this.client.logger.debug(
                `[MultiBot] ${this.client.user?.tag} SKIPPING voice channel ${voiceChannel.id} (${voiceChannel.name}) - responsible bot: ${responsibleBot?.user?.tag ?? "none"}`,
            );
            return;
        }

        this.client.logger.info(
            `[MultiBot] ${this.client.user?.tag} PROCESSING voice channel ${voiceChannel.id} (${voiceChannel.name}) for request from ${message.author.tag}`,
        );

        const songs = await searchTrack(this.client, query).catch(() => null);
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
                this.client.logger.info(
                    `[MultiBot] ${this.client.user?.tag} destroying queue for channel ${existingQueueChannel} to create new queue for channel ${voiceChannel.id}`,
                );
                await guild.queue.destroy();
            }

            const textChannel = guild.channels.cache.get(message.channel.id) as
                | TextChannel
                | undefined;
            if (!textChannel || textChannel.type !== ChannelType.GuildText) {
                this.client.logger.error(
                    `[MultiBot] ${this.client.user?.tag} cannot find text channel ${message.channel.id} in own guild`,
                );
                return;
            }

            guild.queue = new ServerQueue(textChannel);

            try {
                const adapterCreator = createVoiceAdapter(this.client, guild.id);

                this.client.logger.info(
                    `[MultiBot] ${this.client.user?.tag} creating voice connection for channel ${voiceChannel.id} (${voiceChannel.name}) using custom adapter`,
                );

                const connection = joinVoiceChannel({
                    adapterCreator,
                    channelId: voiceChannel.id,
                    guildId: guild.id,
                    selfDeaf: true,
                    group: this.client.user?.id ?? "default",
                }).on("debug", (debugMessage) => {
                    this.client.logger.debug(`[VOICE] ${debugMessage}`);
                });

                guild.queue.connection = connection;
                this.client.logger.info(
                    `[MultiBot] ${this.client.user?.tag} joined voice channel ${voiceChannel.id} (${voiceChannel.name})`,
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

        await this.client.requestChannelManager.updatePlayerMessage(guild);

        if (isNewQueue || wasIdle) {
            void play(guild);
        }

        let confirmEmbed: EmbedBuilder;
        if (songs.playlist) {
            const playlistTitle = songs.playlist.title;
            const playlistUrl = songs.playlist.url;
            confirmEmbed = createEmbed(
                "success",
                `🎶 **|** ${__mf("requestChannel.addedPlaylistToQueue", {
                    playlist: `**[${playlistTitle}](${playlistUrl})**`,
                    count: `**${songs.items.length.toString()}**`,
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
            const msg = await message
                .reply({ embeds: [embed], allowedMentions: { repliedUser: false } })
                .catch(() => null);
            if (msg) {
                setTimeout(() => {
                    void (async () => {
                        try {
                            await msg.delete();
                        } catch {
                            // Ignore errors
                        }
                    })();
                }, 60_000);
            }
        })();
    }

    private getUserFromMention(mention: string): User | undefined {
        const matches = /^<@!?(\d+)>$/u.exec(mention);
        if (!matches) {
            return undefined;
        }

        const id = matches[1];
        return this.client.users.cache.get(id);
    }
}
