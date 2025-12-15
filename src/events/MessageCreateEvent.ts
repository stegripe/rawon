/* eslint-disable prefer-named-capture-group */
import { setTimeout } from "node:timers";
import type { DiscordGatewayAdapterCreator } from "@discordjs/voice";
import { joinVoiceChannel } from "@discordjs/voice";
import { ChannelType, Message, TextChannel, User } from "discord.js";
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
                message.channel.type === ChannelType.DM ? "DM" : `${message.channel.name}(${message.channel.id})`
            ],
            ["Author", `${message.author.tag}(${message.author.id})`]
        ]);

        if (message.author.bot || message.channel.type === ChannelType.DM || !this.client.commands.isReady) return;

        // Handle request channel messages
        if (message.guild && this.client.requestChannelManager.isRequestChannel(message.guild, message.channel.id)) {
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
                                prefix: `\`${this.client.config.mainPrefix}\``
                            })}`
                        )
                    ]
                })
                .catch((error: unknown) => this.client.logger.error("PROMISE_ERR:", error));
        }

        const pref = [...this.client.config.altPrefixes, this.client.config.mainPrefix].find(pr => {
            if (pr === "{mention}") {
                const userMention = /<@(!)?\d*?>/u.exec(message.content);
                if (userMention?.index !== 0) return false;

                const user = this.getUserFromMention(userMention[0]);

                return user?.id === this.client.user?.id;
            }

            return message.content.startsWith(pr);
        });
        if ((pref?.length ?? 0) > 0) {
            this.client.commands.handle(message, pref as unknown as string);
        }
    }

    private async handleRequestChannelMessage(message: Message): Promise<void> {
        const guild = message.guild;
        if (!guild) return;

        // Delete the user's message to keep the channel clean
        await message.delete().catch(() => null);

        const query = message.content.trim();
        if (query.length === 0) return;

        const member = message.member;
        if (!member) return;

        // Check if user is in a voice channel
        const voiceChannel = member.voice.channel;
        if (!voiceChannel) {
            await this.sendTemporaryMessage(message.channel as TextChannel, createEmbed("warn", i18n.__("requestChannel.notInVoice")));
            return;
        }

        // Search for the track
        const songs = await searchTrack(this.client, query).catch(() => null);
        if (!songs || songs.items.length === 0) {
            await this.sendTemporaryMessage(message.channel as TextChannel, createEmbed("error", i18n.__("requestChannel.noResults"), true));
            return;
        }

        const wasIdle = guild.queue?.idle ?? false;
        const isNewQueue = !guild.queue;

        // Create queue if it doesn't exist
        if (!guild.queue) {
            guild.queue = new ServerQueue(message.channel as TextChannel);

            try {
                const connection = joinVoiceChannel({
                    adapterCreator: guild.voiceAdapterCreator as DiscordGatewayAdapterCreator,
                    channelId: voiceChannel.id,
                    guildId: guild.id,
                    selfDeaf: true
                }).on("debug", debugMessage => {
                    this.client.logger.debug(debugMessage);
                });

                guild.queue.connection = connection;
            } catch (error) {
                guild.queue?.songs.clear();
                delete guild.queue;

                await this.sendTemporaryMessage(
                    message.channel as TextChannel,
                    createEmbed("error", i18n.__mf("utils.generalHandler.errorJoining", { message: `\`${(error as Error).message}\`` }), true)
                );
                return;
            }
        }

        // Add songs to queue
        for (const song of songs.type === "results" ? songs.items : [songs.items[0]]) {
            guild.queue.songs.addSong(song, member);
        }

        // Update the player message
        await this.client.requestChannelManager.updatePlayerMessage(guild);

        // Start playback if queue was idle or new
        if (isNewQueue || wasIdle) {
            void play(guild);
        }

        // Send confirmation (will be deleted)
        await this.sendTemporaryMessage(
            message.channel as TextChannel,
            createEmbed("success", i18n.__mf("requestChannel.addedToQueue", { song: songs.items[0].title }))
        );
    }

    private async sendTemporaryMessage(channel: TextChannel, embed: ReturnType<typeof createEmbed>): Promise<void> {
        const msg = await channel.send({ embeds: [embed] });
        setTimeout(() => { 
            void (async () => {
                await msg.delete().catch(() => null);
            })();
        }, 5_000);
    }

    private getUserFromMention(mention: string): User | undefined {
        const matches = /^<@!?(\d+)>$/u.exec(mention);
        if (!matches) return undefined;

        const id = matches[1];
        return this.client.users.cache.get(id);
    }
}
