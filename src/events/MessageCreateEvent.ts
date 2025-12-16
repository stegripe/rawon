import { setTimeout } from "node:timers";
import { type DiscordGatewayAdapterCreator, joinVoiceChannel } from "@discordjs/voice";
import {
    ChannelType,
    type Message,
    type MessageCollector,
    type TextChannel,
    type User,
} from "discord.js";
import i18n from "../config/index.js";
import { BaseEvent } from "../structures/BaseEvent.js";
import { ServerQueue } from "../structures/ServerQueue.js";
import { Event } from "../utils/decorators/Event.js";
import { createEmbed } from "../utils/functions/createEmbed.js";
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

        if (
            message.guild &&
            this.client.requestChannelManager.isRequestChannel(message.guild, message.channel.id)
        ) {
            if ((prefixMatch?.length ?? 0) > 0) {
                this.client.commands.handle(message, prefixMatch as unknown as string);

                setTimeout(() => {
                    void (async (): Promise<void> => {
                        try {
                            await message.delete();
                        } catch {
                            /* ignore */
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
                                /* ignore */
                            }
                        })();
                    }, 60_000);
                });
                return;
            }
            await this.handleRequestChannelMessage(message);
            return;
        }

        if (this.getUserFromMention(message.content)?.id === this.client.user?.id) {
            await message
                .reply({
                    embeds: [
                        createEmbed(
                            "info",
                            `👋 **|** ${i18n.__mf("events.createMessage", {
                                author: message.author.toString(),
                                prefix: `\`${this.client.config.mainPrefix}\``,
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

        await message.delete().catch(() => null);

        const query = message.content.trim();
        if (query.length === 0) {
            return;
        }

        const member = message.member;
        if (!member) {
            return;
        }

        const voiceChannel = member.voice.channel;
        if (!voiceChannel) {
            this.sendTemporaryMessage(
                message.channel as TextChannel,
                createEmbed("warn", i18n.__("requestChannel.notInVoice")),
            );
            return;
        }

        const songs = await searchTrack(this.client, query).catch(() => null);
        if (!songs || songs.items.length === 0) {
            this.sendTemporaryMessage(
                message.channel as TextChannel,
                createEmbed("error", i18n.__("requestChannel.noResults"), true),
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

                this.sendTemporaryMessage(
                    message.channel as TextChannel,
                    createEmbed(
                        "error",
                        i18n.__mf("utils.generalHandler.errorJoining", {
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

        const confirmEmbed = createEmbed(
            "success",
            `🎶 **|** ${i18n.__mf("requestChannel.addedToQueue", { song: songs.items[0].title })}`,
        );
        if (songs.items[0].thumbnail) {
            confirmEmbed.setThumbnail(songs.items[0].thumbnail);
        }
        this.sendTemporaryMessage(message.channel as TextChannel, confirmEmbed);
    }

    private sendTemporaryMessage(
        channel: TextChannel,
        embed: ReturnType<typeof createEmbed>,
    ): void {
        void (async () => {
            const msg = await channel.send({ embeds: [embed] });
            setTimeout(() => {
                void (async () => {
                    try {
                        await msg.delete();
                    } catch {}
                })();
            }, 5_000);
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
