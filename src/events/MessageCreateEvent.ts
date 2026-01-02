import { setTimeout } from "node:timers";
import { type DiscordGatewayAdapterCreator, joinVoiceChannel } from "@discordjs/voice";
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

        if (
            message.author.bot ||
            message.channel.type === ChannelType.DM ||
            !this.client.commands.isReady
        ) {
            return;
        }

        // Multi-bot check: Skip if this is not the responsible bot for this guild
        // Exception: Request channel messages are handled differently based on voice channel
        const isRequestChannel =
            message.guild &&
            this.client.requestChannelManager.isRequestChannel(message.guild, message.channel.id);

        if (message.guild && !this.client.shouldRespondInGuild(message.guild.id)) {
            // Exception 1: Request channel messages - let handleRequestChannelMessage decide
            // based on which voice channel the user is in
            if (isRequestChannel && this.client.multiBotManager.isMultiBotActive()) {
                // Don't early return - let the request channel handler decide
            } else {
                // Exception 2: Allow mention check for any bot in the system
                const mentionedBotId = this.getMentionedBotId(message.content);
                if (mentionedBotId && this.client.multiBotManager.isBotInSystem(mentionedBotId)) {
                    // If mentioning any bot in the system, only the primary bot should respond
                    if (!this.client.isPrimaryBot()) {
                        return;
                    }
                } else {
                    return;
                }
            }
        }

        const prefixMatch = [...this.client.config.altPrefixes, this.client.config.mainPrefix].find(
            (pr) => {
                if (pr === "{mention}") {
                    const userMention = /<@(!)?\d*?>/u.exec(message.content);
                    if (userMention?.index !== 0) {
                        return false;
                    }
                    const user = this.getUserFromMention(userMention[0]);
                    // In multi-bot mode, accept mentions to any bot in the system
                    if (this.client.multiBotManager.isMultiBotActive()) {
                        return (
                            user !== undefined && this.client.multiBotManager.isBotInSystem(user.id)
                        );
                    }
                    return user?.id === this.client.user?.id;
                }
                return message.content.startsWith(pr);
            },
        );

        if (isRequestChannel) {
            if ((prefixMatch?.length ?? 0) > 0) {
                // For commands in request channel, only responsible bot should handle
                if (!this.client.shouldRespondInGuild(message.guild?.id ?? "")) {
                    return;
                }
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
            await this.handleRequestChannelMessage(message);
            return;
        }

        const __mf = i18n__mf(this.client, message.guild);

        // Handle bot mention - in multi-bot mode, show primary bot's prefix
        const mentionedUser = this.getUserFromMention(message.content);
        const isMentioningBotInSystem =
            mentionedUser !== undefined &&
            this.client.multiBotManager.isBotInSystem(mentionedUser.id);
        if (mentionedUser?.id === this.client.user?.id || isMentioningBotInSystem) {
            await message
                .reply({
                    embeds: [
                        createEmbed(
                            "info",
                            `👋 **|** ${__mf("events.createMessage", {
                                author: message.author.toString(),
                                prefix: `**\`${this.client.config.mainPrefix}\`**`,
                            })}`,
                        ),
                    ],
                })
                .catch((error: unknown) => this.client.logger.error("PROMISE_ERR:", error));
        }

        if ((prefixMatch?.length ?? 0) > 0) {
            // In multi-bot mode, check if this bot should handle music commands
            if (this.client.multiBotManager.isMultiBotActive() && message.guild) {
                const args = message.content
                    .slice(
                        prefixMatch === "{mention}"
                            ? (/<@(!)?\d*?>/u.exec(message.content) as string[])[0].length
                            : (prefixMatch as string).length,
                    )
                    .trim()
                    .split(/ +/u);
                const cmd = args[0]?.toLowerCase();

                // Check if this is a music command that requires queue/voice channel context
                const musicCommands = [
                    "queue",
                    "q",
                    "nowplaying",
                    "np",
                    "pause",
                    "resume",
                    "skip",
                    "stop",
                    "volume",
                    "vol",
                    "shuffle",
                    "repeat",
                    "loop",
                    "remove",
                    "skipto",
                    "seek",
                    "filter",
                    "lyrics",
                ];

                if (musicCommands.includes(cmd ?? "")) {
                    // Get the user's voice channel
                    const userVoiceChannel = message.member?.voice.channel;

                    if (userVoiceChannel) {
                        // Get this bot's guild object
                        const thisBotsGuild = this.client.guilds.cache.get(message.guild.id);
                        const thisBotVoiceChannel = thisBotsGuild?.members.me?.voice.channel;

                        // If this bot is not in the user's voice channel, skip
                        if (thisBotVoiceChannel && thisBotVoiceChannel.id !== userVoiceChannel.id) {
                            return;
                        }

                        // If this bot is not in any voice channel but another bot is in the user's channel, skip
                        if (!thisBotVoiceChannel) {
                            const appropriateHandler =
                                this.client.multiBotManager.getVoiceChannelHandler(
                                    message.guild,
                                    userVoiceChannel,
                                );
                            if (
                                appropriateHandler &&
                                appropriateHandler.user?.id !== this.client.user?.id
                            ) {
                                return;
                            }
                        }
                    }
                }
            }

            this.client.commands.handle(message, prefixMatch as unknown as string);
        }
    }

    private async handleRequestChannelMessage(message: Message): Promise<void> {
        const guild = message.guild;
        if (!guild) {
            return;
        }

        const __ = i18n__(this.client, guild);
        const __mf = i18n__mf(this.client, guild);

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

        // Multi-bot mode: Check if this bot should handle this voice channel
        if (this.client.multiBotManager.isMultiBotActive()) {
            // Get this bot's own guild object (important for voice adapter)
            const thisBotsGuild = this.client.guilds.cache.get(guild.id);
            if (!thisBotsGuild) {
                // This bot is not in the guild
                return;
            }

            // Check if THIS bot is already in a voice channel in this guild
            const thisBotVoiceChannel = thisBotsGuild.members.me?.voice.channel;
            if (thisBotVoiceChannel && thisBotVoiceChannel.id !== voiceChannel.id) {
                // This bot is already in a different voice channel
                // Don't move it - let another bot handle this user's voice channel
                return;
            }

            // Check if there's an existing queue connected to a DIFFERENT voice channel
            // The queue is shared, so we need to check if the existing connection is for a different channel
            const existingQueueVoiceChannelId = guild.queue?.connection?.joinConfig.channelId;
            if (existingQueueVoiceChannelId && existingQueueVoiceChannelId !== voiceChannel.id) {
                // There's already a queue for a different voice channel
                // This bot should NOT add to that queue - let another bot handle this user
                return;
            }

            // If this bot is not in any voice channel and there's no queue for user's channel,
            // check if this bot is the appropriate handler
            if (!thisBotVoiceChannel && !existingQueueVoiceChannelId) {
                const appropriateHandler = this.client.multiBotManager.getVoiceChannelHandler(
                    guild,
                    voiceChannel,
                );
                if (appropriateHandler && appropriateHandler.user?.id !== this.client.user?.id) {
                    // Another bot should handle this voice channel
                    return;
                }
            }
        }

        const songs = await searchTrack(this.client, query).catch(() => null);
        if (!songs || songs.items.length === 0) {
            this.sendTemporaryReply(
                message,
                createEmbed("error", __("requestChannel.noResults"), true),
            );
            return;
        }

        // In multi-bot mode, use THIS bot's guild object to ensure proper voice adapter
        const targetGuild = this.client.multiBotManager.isMultiBotActive()
            ? (this.client.guilds.cache.get(guild.id) ?? guild)
            : guild;

        const wasIdle = targetGuild.queue?.idle ?? false;
        const isNewQueue = !targetGuild.queue;

        if (!targetGuild.queue) {
            targetGuild.queue = new ServerQueue(message.channel as TextChannel);

            try {
                const connection = joinVoiceChannel({
                    adapterCreator: targetGuild.voiceAdapterCreator as DiscordGatewayAdapterCreator,
                    channelId: voiceChannel.id,
                    guildId: targetGuild.id,
                    selfDeaf: true,
                }).on("debug", (debugMessage) => {
                    this.client.logger.debug(debugMessage);
                });

                targetGuild.queue.connection = connection;
            } catch (error) {
                targetGuild.queue?.songs.clear();
                delete targetGuild.queue;

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
            targetGuild.queue.songs.addSong(song, member);
        }

        await this.client.requestChannelManager.updatePlayerMessage(targetGuild);

        if (isNewQueue || wasIdle) {
            void play(targetGuild);
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

    private getMentionedBotId(content: string): string | undefined {
        const matches = /^<@!?(\d+)>$/u.exec(content);
        if (!matches) {
            return undefined;
        }
        return matches[1];
    }
}
