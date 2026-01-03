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
import { i18n__, i18n__mf } from "../utils/functions/i18n.js";
import { searchTrack } from "../utils/handlers/GeneralUtil.js";
import { play } from "../utils/handlers/general/play.js";
import { createVoiceAdapter } from "../utils/functions/createVoiceAdapter.js";

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

        // Log that this bot received the event
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

        const prefixMatch = [...this.client.config.altPrefixes, this.client.config.mainPrefix].find(
            (pr) => {
                if (pr === "{mention}") {
                    const userMention = /<@(!)?\d*?>/u.exec(message.content);
                    if (userMention?.index !== 0) {
                        return false;
                    }
                    const user = this.getUserFromMention(userMention[0]);
                    return user?.id === this.client.user?.id;
                }
                return message.content.startsWith(pr);
            },
        );

        // Check if this is a request channel
        // IMPORTANT: All bots should check this, not just primary bot
        const isRequestChannel = message.guild && 
            this.client.requestChannelManager.isRequestChannel(message.guild, message.channel.id);
        
        // Debug log for all bots
        if (message.guild) {
            this.client.logger.debug(
                `[MultiBot] ${this.client.user?.tag} checking request channel: channelId=${message.channel.id}, isRequestChannel=${isRequestChannel}`,
            );
        }
        
        if (isRequestChannel) {
            // Log that this bot received a message in request channel
            this.client.logger.debug(
                `[MultiBot] ${this.client.user?.tag} received message in request channel ${message.channel.id} from ${message.author.tag}`,
            );

            if ((prefixMatch?.length ?? 0) > 0) {
                // Multi-bot: Check if this bot should handle the command
                if (message.guild && this.client.config.isMultiBot) {
                    // CRITICAL: Use THIS bot's guild object
                    const thisBotGuild = this.client.guilds.cache.get(message.guild.id);
                    if (!thisBotGuild) {
                        return;
                    }

                    // Extract command name from message content (after prefix)
                    // prefixMatch is the prefix string (e.g. "d!"), not an array!
                    const prefix = prefixMatch || "";
                    const cmdContent = message.content.slice(prefix.length).trim();
                    const cmdName = cmdContent.split(/ +/u)[0]?.toLowerCase();
                    const musicCommands = [
                        "volume", "vol", "loop", "repeat", "shuffle", "filter", "skip", "skipto",
                        "pause", "resume", "stop", "disconnect", "dc", "remove", "seek",
                    ];
                    const isMusicCommand = cmdName && musicCommands.includes(cmdName);

                    if (isMusicCommand) {
                        // For music commands, check voice channel
                        // CRITICAL: Fetch member if not in cache to get accurate voice state
                        let member = thisBotGuild.members.cache.get(message.author.id);
                        if (!member) {
                            try {
                                const fetchedMember = await thisBotGuild.members.fetch(message.author.id).catch(() => null);
                                if (fetchedMember) {
                                    member = fetchedMember;
                                }
                            } catch {
                                // If fetch fails, try using message.member as fallback
                                if (message.member && message.member.guild.id === thisBotGuild.id) {
                                    member = message.member;
                                }
                            }
                        }
                        // Final fallback to message.member if still no member
                        if (!member && message.member && message.member.guild.id === thisBotGuild.id) {
                            member = message.member;
                        }
                        
                        const userVoiceChannelId = member?.voice.channelId ?? null;

                        this.client.logger.info(
                            `[MultiBot] ${this.client.user?.tag} PRE-CHECK music command "${cmdName}" in REQUEST CHANNEL from ${message.author.tag}: ` +
                            `userVoiceChannel=${userVoiceChannelId ?? "none"}`,
                        );

                        if (userVoiceChannelId) {
                            const shouldRespond = this.client.multiBotManager.shouldRespondToMusicCommand(
                                this.client,
                                thisBotGuild,
                                userVoiceChannelId,
                            );
                            
                            this.client.logger.info(
                                `[MultiBot] ${this.client.user?.tag} PRE-CHECK result for music command "${cmdName}": shouldRespond=${shouldRespond}`,
                            );
                            
                            if (!shouldRespond) {
                                this.client.logger.warn(
                                    `[MultiBot] ${this.client.user?.tag} ❌❌❌ BLOCKING music command "${cmdName}" in REQUEST CHANNEL from ${message.author.tag} ` +
                                    `- NOT in same voice channel (user in: ${userVoiceChannelId}). RETURNING EARLY - COMMAND WILL NOT EXECUTE!`,
                                );
                                // CRITICAL: Return immediately - do NOT process command
                                return;
                            }
                            
                            this.client.logger.info(
                                `[MultiBot] ${this.client.user?.tag} ✅ ALLOWING music command "${cmdName}" in REQUEST CHANNEL - will proceed to command handler`,
                            );
                        } else {
                            // User not in voice, use normal priority check
                            if (!this.client.multiBotManager.shouldRespond(this.client, thisBotGuild)) {
                                this.client.logger.debug(
                                    `[MultiBot] ${this.client.user?.tag} skipping music command in request channel - not responsible bot`,
                                );
                                return;
                            }
                        }
                    } else {
                        // Non-music command, use normal priority check
                        if (!this.client.multiBotManager.shouldRespond(this.client, thisBotGuild)) {
                            this.client.logger.debug(
                                `[MultiBot] ${this.client.user?.tag} skipping prefix command in request channel - not responsible bot`,
                            );
                            return;
                        }
                    }
                }

                // Only reach here if command should be processed
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
            // This is a music request (not a command)
            // IMPORTANT: All bots receive the message, but only the responsible bot processes it
            // The shouldRespondToVoice check is inside handleRequestChannelMessage
            this.client.logger.debug(
                `[MultiBot] ${this.client.user?.tag} calling handleRequestChannelMessage for ${message.author.tag}`,
            );
            await this.handleRequestChannelMessage(message);
            return;
        }

        const __mf = i18n__mf(this.client, message.guild);

        // Multi-bot: Check if mention is for any of the bot instances
        const mentionedBot = this.getUserFromMention(message.content);
        const shouldRespondToMention =
            mentionedBot &&
            (mentionedBot.id === this.client.user?.id ||
                (this.client.config.isMultiBot &&
                    this.client.multiBotManager
                        .getBots()
                        .some((bot) => bot.botId === mentionedBot.id) &&
                    this.client.multiBotManager.shouldRespond(this.client, message.guild!)));

        if (shouldRespondToMention) {
            // Get prefix from primary bot for consistency
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
            // Multi-bot: Only responsible bot handles prefix commands
            if (message.guild && this.client.config.isMultiBot) {
                // CRITICAL: Use THIS bot's guild object, not message.guild
                // message.guild might be from a different bot instance
                const thisBotGuild = this.client.guilds.cache.get(message.guild.id);
                if (!thisBotGuild) {
                    // This bot doesn't have this guild, skip
                    return;
                }

                // Extract command name from message content (after prefix)
                // prefixMatch is the prefix string (e.g. "d!"), not an array!
                const prefix = prefixMatch || "";
                const cmdContent = message.content.slice(prefix.length).trim();
                const cmdName = cmdContent.split(/ +/u)[0]?.toLowerCase();
                const musicCommands = [
                    "volume", "vol", "loop", "repeat", "shuffle", "filter", "skip", "skipto",
                    "pause", "resume", "stop", "disconnect", "dc", "remove", "seek",
                ];
                const isMusicCommand = cmdName && musicCommands.includes(cmdName);

                if (isMusicCommand) {
                    // CRITICAL: For music commands, ALWAYS check voice channel first before processing
                    // Get member from THIS bot's guild object for accurate voice channel info
                    // CRITICAL: Fetch member if not in cache to get accurate voice state
                    let member = thisBotGuild.members.cache.get(message.author.id);
                    if (!member) {
                        try {
                            const fetchedMember = await thisBotGuild.members.fetch(message.author.id).catch(() => null);
                            if (fetchedMember) {
                                member = fetchedMember;
                            }
                        } catch {
                            // If fetch fails, try using message.member as fallback
                            if (message.member && message.member.guild.id === thisBotGuild.id) {
                                member = message.member;
                            }
                        }
                    }
                    // Final fallback to message.member if still no member
                    if (!member && message.member && message.member.guild.id === thisBotGuild.id) {
                        member = message.member;
                    }
                    
                    const userVoiceChannelId = member?.voice.channelId ?? null;
                    
                    this.client.logger.debug(
                        `[MultiBot] ${this.client.user?.tag} checking music command "${cmdName}" from ${message.author.tag}: ` +
                        `userVoiceChannel=${userVoiceChannelId ?? "none"}, memberCached=${member !== null}`,
                    );

                    if (userVoiceChannelId) {
                        // For music commands with user in voice channel, check if bot is in same voice channel
                        const shouldRespond = this.client.multiBotManager.shouldRespondToMusicCommand(
                            this.client,
                            thisBotGuild,
                            userVoiceChannelId,
                        );
                        
                        if (!shouldRespond) {
                            this.client.logger.warn(
                                `[MultiBot] ${this.client.user?.tag} ❌❌❌ BLOCKING music command "${cmdName}" from ${message.author.tag} ` +
                                `- NOT in same voice channel (user in: ${userVoiceChannelId}). ` +
                                `RETURNING EARLY - COMMAND WILL NOT BE EXECUTED!`,
                            );
                            // CRITICAL: Return early to prevent command execution
                            // Do NOT call commands.handle() - command should be completely ignored
                            // This prevents the wrong bot from processing music commands
                            return; // RETURN IMMEDIATELY - DO NOT PROCESS COMMAND
                        }
                        this.client.logger.info(
                            `[MultiBot] ${this.client.user?.tag} ALLOWING music command "${cmdName}" from ${message.author.tag} - in same voice channel (${userVoiceChannelId})`,
                        );
                    } else {
                        // User not in voice channel, but it's a music command - still need to check priority
                        if (!this.client.multiBotManager.shouldRespond(this.client, thisBotGuild)) {
                            this.client.logger.debug(
                                `[MultiBot] ${this.client.user?.tag} skipping music command "${cmdName}" - user not in voice and not responsible bot`,
                            );
                            return;
                        }
                    }
                } else {
                    // For non-music commands, use normal priority check
                    if (!this.client.multiBotManager.shouldRespond(this.client, thisBotGuild)) {
                        this.client.logger.debug(
                            `[MultiBot] ${this.client.user?.tag} skipping prefix command "${cmdName}" - not responsible bot`,
                        );
                        return;
                    }
                }
            }
            this.client.commands.handle(message, prefixMatch as unknown as string);
        }
    }

    private async handleRequestChannelMessage(message: Message): Promise<void> {
        // CRITICAL: Always use THIS bot's guild object, not the parameter guild
        // The message.guild might be from a different bot instance
        if (!message.guild) {
            return;
        }

        // Get THIS bot's own guild object
        const thisBotGuild = this.client.guilds.cache.get(message.guild.id);
        if (!thisBotGuild) {
            this.client.logger.warn(
                `[MultiBot] ${this.client.user?.tag} cannot find guild ${message.guild.id} in its own cache`,
            );
            return;
        }

        const guild = thisBotGuild; // Use this bot's guild object from now on

        const __ = i18n__(this.client, guild);
        const __mf = i18n__mf(this.client, guild);

        // Log that this bot received the message
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

        // Multi-bot: Check if this bot should handle this voice channel
        // MUST check before processing to prevent duplicate responses
        const shouldHandle = this.client.multiBotManager.shouldRespondToVoice(
            this.client,
            guild,
            voiceChannel.id,
        );
        
        if (!shouldHandle) {
            // Debug log to see which bot should handle this
            const responsibleBot = this.client.multiBotManager.getBotForVoiceChannel(
                guild,
                voiceChannel.id,
            );
            this.client.logger.debug(
                `[MultiBot] ${this.client.user?.tag} SKIPPING voice channel ${voiceChannel.id} (${voiceChannel.name}) - responsible bot: ${responsibleBot?.user?.tag ?? "none"}`,
            );
            return; // Another bot should handle this voice channel - DO NOT PROCESS
        }
        
        // Only log if we're actually going to process
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
        
        // Multi-bot: Check if existing queue is for the correct voice channel
        // If queue exists but is for a different voice channel, we need to create a new queue
        const existingQueueChannel = guild.queue?.connection?.joinConfig.channelId;
        const isNewQueue = !guild.queue || (existingQueueChannel !== undefined && existingQueueChannel !== voiceChannel.id);

        if (!guild.queue || (existingQueueChannel !== undefined && existingQueueChannel !== voiceChannel.id)) {
            // Destroy old queue if it exists but is for a different channel
            if (guild.queue && existingQueueChannel !== voiceChannel.id) {
                this.client.logger.info(
                    `[MultiBot] ${this.client.user?.tag} destroying queue for channel ${existingQueueChannel} to create new queue for channel ${voiceChannel.id}`,
                );
                guild.queue.destroy();
            }

            // Use this bot's guild object to get the correct text channel
            const textChannel = guild.channels.cache.get(message.channel.id) as TextChannel | undefined;
            if (!textChannel || textChannel.type !== ChannelType.GuildText) {
                this.client.logger.error(
                    `[MultiBot] ${this.client.user?.tag} cannot find text channel ${message.channel.id} in own guild`,
                );
                return;
            }

            guild.queue = new ServerQueue(textChannel);
            
            // Multi-bot: Each bot instance has independent state (volume, loop, shuffle, filters)
            // No state copying - each bot/queue manages its own settings

            try {
                // Use custom voice adapter creator that explicitly uses THIS client
                // This ensures the connection uses the correct bot instance in multi-bot scenarios
                const adapterCreator = createVoiceAdapter(this.client, guild.id);
                
                this.client.logger.info(
                    `[MultiBot] ${this.client.user?.tag} creating voice connection for channel ${voiceChannel.id} (${voiceChannel.name}) using custom adapter`,
                );

                const connection = joinVoiceChannel({
                    adapterCreator,
                    channelId: voiceChannel.id,
                    guildId: guild.id,
                    selfDeaf: true,
                    // CRITICAL: Use bot's user ID as group to ensure each bot instance has isolated voice connections
                    // This prevents multiple bot instances from interfering with each other's voice connections
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
            const msg = await message.reply({ embeds: [embed] }).catch(() => null);
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
