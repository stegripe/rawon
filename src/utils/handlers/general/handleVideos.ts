import { setTimeout } from "node:timers";
import { type DiscordGatewayAdapterCreator, joinVoiceChannel } from "@discordjs/voice";
import {
    escapeMarkdown,
    type Message,
    type StageChannel,
    type TextChannel,
    type VoiceChannel,
} from "discord.js";
import { type CommandContext } from "../../../structures/CommandContext.js";
import { type Rawon } from "../../../structures/Rawon.js";
import { ServerQueue } from "../../../structures/ServerQueue.js";
import { type Song } from "../../../typings/index.js";
import { chunk } from "../../functions/chunk.js";
import { createEmbed } from "../../functions/createEmbed.js";
import { i18n__, i18n__mf } from "../../functions/i18n.js";
import { parseHTMLElements } from "../../functions/parseHTMLElements.js";
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

export async function handleVideos(
    client: Rawon,
    ctx: CommandContext,
    toQueue: Song[],
    voiceChannel: StageChannel | VoiceChannel,
): Promise<Message | undefined> {
    const wasIdle = ctx.guild?.queue?.idle;
    const inRequestChannel = isRequestChannel(client, ctx);

    const __ = i18n__(client, ctx.guild);
    const __mf = i18n__mf(client, ctx.guild);

    async function sendPagination(): Promise<void> {
        for (const song of toQueue) {
            ctx.guild?.queue?.songs.addSong(
                song,
                ctx.member as unknown as NonNullable<typeof ctx.member>,
            );
        }

        const opening = __mf("utils.generalHandler.handleVideoInitial", {
            length: toQueue.length,
        });
        const pages = chunk(toQueue, 10).map((vals, i) => {
            const texts = vals.map(
                (song, index) =>
                    `${i * 10 + (index + 1)}.) ${escapeMarkdown(parseHTMLElements(song.title))}`,
            );

            return texts.join("\n");
        });
        const embed = createEmbed("info", opening);
        const msg = await ctx.reply({ embeds: [embed] }, true);

        if (inRequestChannel && msg) {
            autoDeleteMessage(msg);
        }

        return new ButtonPagination(msg, {
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
    }

    if (ctx.guild?.queue) {
        await sendPagination();

        if (wasIdle === true) {
            void play(ctx.guild, undefined, wasIdle);
        }

        return;
    }

    (ctx.guild as unknown as NonNullable<typeof ctx.guild>).queue = new ServerQueue(
        ctx.channel as TextChannel,
    );
    await sendPagination();

    client.debugLog.logData(
        "info",
        "HANDLE_VIDEOS",
        `Created a server queue for ${ctx.guild?.name}(${ctx.guild?.id})`,
    );

    try {
        const connection = joinVoiceChannel({
            adapterCreator: ctx.guild?.voiceAdapterCreator as DiscordGatewayAdapterCreator,
            channelId: voiceChannel.id,
            guildId: ctx.guild?.id ?? "",
            selfDeaf: true,
        }).on("debug", (message) => {
            client.logger.debug(message);
        });

        (
            ctx.guild?.queue as unknown as NonNullable<NonNullable<typeof ctx.guild>["queue"]>
        ).connection = connection;

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
            `Error occured while connecting to ${ctx.guild?.name}(${ctx.guild?.id}). Reason: ${
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

    void play(ctx.guild as unknown as NonNullable<typeof ctx.guild>);
}
