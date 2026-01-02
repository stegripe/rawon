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
            // Check if there's an existing queue for a DIFFERENT voice channel
            const existingQueueVoiceChannelId = guild.queue?.connection?.joinConfig.channelId;
            if (existingQueueVoiceChannelId && existingQueueVoiceChannelId !== voiceChannel.id) {
                // User is in a different voice channel than the existing queue
                // This bot should NOT handle this request - let another bot handle it
                return;
            }

            // Check if this bot is the appropriate handler for this voice channel
            const appropriateHandler = this.client.multiBotManager.getVoiceChannelHandler(
                guild,
                voiceChannel,
            );
            if (appropriateHandler && appropriateHandler.user?.id !== this.client.user?.id) {
                // Another bot should handle this voice channel
                return;
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

        const wasIdle = guild.queue?.idle ?? false;
        const isNewQueue = !guild.queue;

        if (!guild.queue) {
            guild.queue = new ServerQueue(message.channel as TextChannel);

            try {
                const connection = joinVoiceChannel({
                    adapterCreator: guild.voiceAdapterCreator as DiscordGatewayAdapterCreator,
                    channelId: voiceChannel.id,
                    guildId: guild.id,
                    selfDeaf: true,
                }).on("debug", (debugMessage) => {
                    this.client.logger.debug(debugMessage);
                });

                guild.queue.connection = connection;
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

    private getMentionedBotId(content: string): string | undefined {
        const matches = /^<@!?(\d+)>$/u.exec(content);
        if (!matches) {
            return undefined;
        }
        return matches[1];
    }
}
