import { setTimeout } from "node:timers";
import { joinVoiceChannel } from "@discordjs/voice";
import {
    ChannelType,
    type Guild,
    type Message,
    PermissionFlagsBits,
    type StageChannel,
    type VoiceChannel,
} from "discord.js";
import { type CommandContext } from "../../../structures/CommandContext.js";
import { type Rawon } from "../../../structures/Rawon.js";
import { ServerQueue, type ServerQueueTextChannel } from "../../../structures/ServerQueue.js";
import { type PlaylistMetadata, type Song } from "../../../typings/index.js";
import { chunk } from "../../functions/chunk.js";
import { createEmbed } from "../../functions/createEmbed.js";
import { createVoiceAdapter } from "../../functions/createVoiceAdapter.js";
import { formatBoldCodeSpan } from "../../functions/formatCodeSpan.js";
import { formatBoldMarkdownLink, formatMarkdownText } from "../../functions/formatMarkdown.js";
import { i18n__, i18n__mf } from "../../functions/i18n.js";
import { ButtonPagination } from "../../structures/ButtonPagination.js";
import { play } from "./play.js";

function isRequestChannel(client: Rawon, ctx: CommandContext): boolean {
    if (!ctx.guild) {
        return false;
    }
    const requestChannel = client.requestChannelManager.getRequestChannel(ctx.guild);
    return requestChannel !== null && ctx.channel?.id === requestChannel.id;
}

function autoDeleteMessage(msg: Message, delay = 60_000): void {
    setTimeout(() => {
        msg.delete().catch(() => null);
    }, delay);
}

function isSupportedQueueTextChannel(channel: unknown): channel is ServerQueueTextChannel {
    return (
        channel !== null &&
        typeof channel === "object" &&
        "type" in channel &&
        [ChannelType.GuildText, ChannelType.GuildVoice, ChannelType.GuildStageVoice].includes(
            channel.type as ChannelType,
        )
    );
}

function canSendQueueMessages(guild: Guild, channel: ServerQueueTextChannel): boolean {
    const botMember = guild.members.me;
    if (!botMember) {
        return false;
    }

    const permissions = channel.permissionsFor(botMember);
    return (
        permissions?.has(PermissionFlagsBits.ViewChannel) === true &&
        permissions.has(PermissionFlagsBits.SendMessages) &&
        permissions.has(PermissionFlagsBits.EmbedLinks)
    );
}

function resolveQueueTextChannel(
    client: Rawon,
    ctx: CommandContext,
    voiceChannel: StageChannel | VoiceChannel,
): ServerQueueTextChannel | null {
    const guild = ctx.guild;
    if (!guild) {
        return null;
    }

    const candidates: Array<ServerQueueTextChannel | null | undefined> = [
        guild.queue?.textChannel,
        isSupportedQueueTextChannel(ctx.channel) && ctx.channel.guild.id === guild.id
            ? ctx.channel
            : null,
        client.requestChannelManager.getRequestChannel(guild),
        voiceChannel,
        guild.systemChannel,
    ];

    for (const channel of candidates) {
        if (channel && canSendQueueMessages(guild, channel)) {
            return channel;
        }
    }

    return (
        guild.channels.cache
            .filter(isSupportedQueueTextChannel)
            .sort((a, b) => a.rawPosition - b.rawPosition || a.id.localeCompare(b.id))
            .find((channel) => canSendQueueMessages(guild, channel)) ?? null
    );
}

export async function handleVideos(
    client: Rawon,
    ctx: CommandContext,
    toQueue: Song[],
    voiceChannel: StageChannel | VoiceChannel,
    playlistMeta?: PlaylistMetadata,
): Promise<Message | undefined> {
    const wasIdle = ctx.guild?.queue?.idle;
    const inRequestChannel = isRequestChannel(client, ctx);

    const __ = i18n__(client, ctx.guild);
    const __mf = i18n__mf(client, ctx.guild);

    async function sendConfirmation(): Promise<Message | undefined> {
        for (const song of toQueue) {
            ctx.guild?.queue?.songs.addSong(song, ctx.member as NonNullable<typeof ctx.member>);
        }

        if (toQueue.length === 1) {
            const song = toQueue[0];
            const songUrl = song.url;
            const confirmEmbed = createEmbed(
                "success",
                `🎶 **|** ${__mf("requestChannel.addedToQueue", {
                    song: formatBoldMarkdownLink(song.title, songUrl),
                })}`,
            );
            if (song.thumbnail) {
                confirmEmbed.setThumbnail(song.thumbnail);
            }
            const msg = await ctx.reply(
                { embeds: [confirmEmbed], allowedMentions: { repliedUser: false } },
                true,
            );

            if (inRequestChannel && msg) {
                autoDeleteMessage(msg);
            }
            return msg;
        }

        if (playlistMeta !== undefined) {
            const playlistText =
                (playlistMeta.url?.length ?? 0) > 0
                    ? formatBoldMarkdownLink(playlistMeta.title, playlistMeta.url)
                    : `**${formatMarkdownText(playlistMeta.title)}**`;
            const confirmEmbed = createEmbed(
                "success",
                `🎶 **|** ${__mf("requestChannel.addedPlaylistToQueue", {
                    count: formatBoldCodeSpan(toQueue.length.toString()),
                    playlist: playlistText,
                })}`,
            );

            if ((playlistMeta.thumbnail?.length ?? 0) > 0) {
                confirmEmbed.setThumbnail(playlistMeta.thumbnail ?? null);
            }

            if ((playlistMeta.author?.length ?? 0) > 0) {
                confirmEmbed.setFooter({
                    text: `📁 ${playlistMeta.author}`,
                });
            }

            const msg = await ctx.reply(
                { embeds: [confirmEmbed], allowedMentions: { repliedUser: false } },
                true,
            );

            if (inRequestChannel && msg) {
                autoDeleteMessage(msg);
            }

            return msg;
        }

        const opening = __mf("utils.generalHandler.handleVideoInitial", {
            length: toQueue.length,
        });
        const pages = chunk(toQueue, 10).map((vals, i) => {
            const texts = vals.map(
                (song, index) => `${i * 10 + (index + 1)}.) ${formatMarkdownText(song.title)}`,
            );

            return texts.join("\n");
        });
        const embed = createEmbed("info", opening);
        const msg = await ctx.reply(
            { embeds: [embed], allowedMentions: { repliedUser: false } },
            true,
        );

        if (inRequestChannel && msg) {
            autoDeleteMessage(msg);
        }

        void new ButtonPagination(msg, {
            author: ctx.author.id,
            edit: (i, emb, page) => {
                emb.setDescription(`\`\`\`\n${page}\`\`\``)
                    .setAuthor({
                        name: opening,
                    })
                    .setFooter({
                        text: `• ${__mf("reusable.pageFooter", {
                            actual: i + 1,
                            total: pages.length,
                        })}`,
                    });
            },
            embed,
            pages,
        }).start();

        return msg;
    }

    if (ctx.guild?.queue) {
        await sendConfirmation();

        if (wasIdle === true) {
            void play(ctx.guild, undefined, wasIdle);
        }

        return;
    }

    const queueTextChannel = resolveQueueTextChannel(client, ctx, voiceChannel);
    if (!queueTextChannel) {
        return ctx.reply({
            embeds: [
                createEmbed(
                    "error",
                    __mf("utils.commonUtil.botMissingChannelPerms", {
                        channel: ctx.guild?.name ?? "#unknown",
                        permissions: "**`View Channel`**, **`Send Messages`**, **`Embed Links`**",
                    }),
                    true,
                ),
            ],
        });
    }

    (ctx.guild as NonNullable<typeof ctx.guild>).queue = new ServerQueue(queueTextChannel);
    await sendConfirmation();

    client.debugLog.logData(
        "info",
        "HANDLE_VIDEOS",
        `Created a server queue for ${ctx.guild?.name}(${ctx.guild?.id})`,
    );

    try {
        if (!ctx.guild) {
            throw new Error("Guild is null");
        }

        if (!ctx.guild) {
            throw new Error("Guild is null");
        }

        const adapterCreator = createVoiceAdapter(client, ctx.guild.id);

        client.logger.debug(
            `[MultiBot] ${client.user?.tag} creating voice connection using custom adapter for channel ${voiceChannel.id}`,
        );

        const connection = joinVoiceChannel({
            adapterCreator,
            channelId: voiceChannel.id,
            guildId: ctx.guild.id,
            selfDeaf: true,
            group: client.user?.id ?? "default",
        }).on("debug", (message) => {
            client.logger.debug(message);
        });

        (ctx.guild?.queue as NonNullable<NonNullable<typeof ctx.guild>["queue"]>).connection =
            connection;

        client.debugLog.logData(
            "info",
            "HANDLE_VIDEOS",
            `Connected to ${voiceChannel.name}(${voiceChannel.id}) in guild ${ctx.guild?.name}(${ctx.guild?.id})`,
        );
    } catch (error) {
        ctx.guild?.queue?.songs.clear();
        delete ctx.guild?.queue;

        client.debugLog.logData(
            "error",
            "HANDLE_VIDEOS",
            `Error occurred while connecting to ${ctx.guild?.name}(${ctx.guild?.id}). Reason: ${
                (error as Error).message
            }`,
        );

        client.logger.error("PLAY_CMD_ERR:", error);
        const channel = ctx.channel;
        if (channel !== null && "send" in channel) {
            try {
                const errorMsg = await channel.send({
                    embeds: [
                        createEmbed(
                            "error",
                            __mf("utils.generalHandler.errorJoining", {
                                message: `\`${(error as Error).message}\``,
                            }),
                            true,
                        ),
                    ],
                });
                if (inRequestChannel && errorMsg) {
                    autoDeleteMessage(errorMsg);
                }
            } catch (error_: unknown) {
                client.logger.error("PLAY_CMD_ERR:", error_);
            }
        }
        return;
    }

    void play(ctx.guild as NonNullable<typeof ctx.guild>);
}
