/** biome-ignore-all lint/style/useNamingConvention: disable naming convention rule for this file */
import { clearInterval, setInterval } from "node:timers";
import { type AudioPlayerState, type AudioResource } from "@discordjs/voice";
import { ApplyOptions } from "@sapphire/decorators";
import { type Command } from "@sapphire/framework";
import { type CommandContext, ContextCommand } from "@stegripe/command-context";
import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ComponentType,
    type EmbedBuilder,
    type Interaction,
    PermissionFlagsBits,
    type SlashCommandBuilder,
} from "discord.js";
import i18n from "../../config/index.js";
import { CommandContext as LocalCommandContext } from "../../structures/CommandContext.js";
import { type Rawon } from "../../structures/Rawon.js";
import { type QueueSong } from "../../typings/index.js";
import { haveQueue, useRequestChannel } from "../../utils/decorators/MusicUtil.js";
import { createEmbed } from "../../utils/functions/createEmbed.js";
import { createProgressBar } from "../../utils/functions/createProgressBar.js";
import { i18n__, i18n__mf } from "../../utils/functions/i18n.js";
import { normalizeTime } from "../../utils/functions/normalizeTime.js";

@ApplyOptions<Command.Options>({
    name: "nowplaying",
    aliases: ["np"],
    description: i18n.__("commands.music.nowplaying.description"),
    detailedDescription: { usage: "{prefix}nowplaying" },
    requiredClientPermissions: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.EmbedLinks,
    ],
    chatInputCommand(
        builder: Parameters<NonNullable<Command.Options["chatInputCommand"]>>[0],
        opts: Parameters<NonNullable<Command.Options["chatInputCommand"]>>[1],
    ): SlashCommandBuilder {
        return builder
            .setName(opts.name ?? "nowplaying")
            .setDescription(
                opts.description ?? "Show the media player status.",
            ) as SlashCommandBuilder;
    },
})
export class NowPlayingCommand extends ContextCommand {
    private getClient(ctx: CommandContext): Rawon {
        return ctx.client as Rawon;
    }

    @useRequestChannel
    @haveQueue
    public async contextRun(ctx: CommandContext): Promise<void> {
        const client = this.getClient(ctx);
        const __ = i18n__(client, ctx.guild);
        const __mf = i18n__mf(client, ctx.guild);
        const getEmbed = (): EmbedBuilder => {
            try {
                const res = (
                    ctx.guild?.queue?.player.state as
                        | (AudioPlayerState & {
                              resource: AudioResource | undefined;
                          })
                        | undefined
                )?.resource;
                const queueSong = res?.metadata as QueueSong | undefined;
                const song = queueSong?.song;
                const seekOffset = ctx.guild?.queue?.seekOffset ?? 0;

                const embed = createEmbed(
                    "info",
                    `${ctx.guild?.queue?.playing === true ? "▶️" : "⏸️"} **|** `,
                );
                const defaultThumb = "https://cdn.stegripe.org/images/icon.png";
                let thumb: string | undefined = song?.thumbnail;
                if (typeof thumb !== "string" || !/^https?:\/\//i.test(thumb)) {
                    thumb = defaultThumb;
                }
                embed.setThumbnail(thumb);

                const curr = Math.trunc((res?.playbackDuration ?? 0) / 1_000) + seekOffset;
                let progressLine: string;
                if (song?.isLive === true) {
                    progressLine = `🔴 **\`${__("commands.music.nowplaying.live")}\`**`;
                } else if (song) {
                    const total = Number.isFinite(song.duration) ? song.duration : 0;
                    if (total <= 0) {
                        progressLine = `${normalizeTime(curr)} • ${__("commands.music.nowplaying.unknownDuration")}`;
                    } else {
                        progressLine = `${normalizeTime(curr)} ${createProgressBar(curr, total)} ${normalizeTime(total)}`;
                    }
                } else {
                    progressLine = "";
                }

                if (song) {
                    const requesterLine = queueSong?.requester
                        ? `\n\n${__("commands.music.nowplaying.requestedBy")}: ${queueSong.requester.toString()}`
                        : "";
                    embed.data.description += `**[${song.title}](${song.url})**\n${progressLine}${requesterLine}`;
                } else {
                    embed.data.description += __("commands.music.nowplaying.emptyQueue");
                }

                return embed;
            } catch (error) {
                this.container.logger.error(
                    "NOWPLAY_ERR:",
                    error instanceof Error ? (error.stack ?? error) : error,
                );
                const msg = __mf("commands.music.nowplaying.error", {
                    message: (error as Error)?.message ?? "Unknown error",
                });
                return createEmbed("error", msg, true);
            }
        };

        const hasRequestChannel = ctx.guild
            ? (ctx.guild.client as unknown as Rawon).requestChannelManager.hasRequestChannel(
                  ctx.guild,
              )
            : false;

        if (hasRequestChannel) {
            await ctx.reply({ embeds: [getEmbed()] });
            return;
        }

        const buttons = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
                .setCustomId("TOGGLE_STATE_BUTTON")
                .setLabel("Pause/Resume")
                .setStyle(ButtonStyle.Primary)
                .setEmoji("⏯️"),
            new ButtonBuilder()
                .setCustomId("SKIP_BUTTON")
                .setLabel("Skip")
                .setStyle(ButtonStyle.Secondary)
                .setEmoji("⏭️"),
            new ButtonBuilder()
                .setCustomId("STOP_BUTTON")
                .setLabel("Stop Player")
                .setStyle(ButtonStyle.Danger)
                .setEmoji("⏹️"),
            new ButtonBuilder()
                .setCustomId("SHOW_QUEUE_BUTTON")
                .setLabel("Show Queue")
                .setStyle(ButtonStyle.Secondary)
                .setEmoji("#️⃣"),
        );
        const msg = await ctx.reply({ embeds: [getEmbed()], components: [buttons] });

        const collector = msg.createMessageComponentCollector({
            componentType: ComponentType.Button,
            filter: (i) => i.isButton() && i.user.id === ctx.author.id,
            idle: 30_000,
        });

        const updateInterval = setInterval(async () => {
            try {
                const res = (
                    ctx.guild?.queue?.player.state as
                        | (AudioPlayerState & {
                              resource: AudioResource | undefined;
                          })
                        | undefined
                )?.resource;
                const queueSong = res?.metadata as QueueSong | undefined;
                if (!queueSong) {
                    return;
                }

                await msg.edit({ embeds: [getEmbed()] }).catch(() => null);
            } catch {
                // Ignore errors
            }
        }, 5_000);

        collector
            .on("collect", async (i) => {
                const newCtx = new LocalCommandContext(i as unknown as Interaction, []);
                let cmdName = "";

                switch (i.customId) {
                    case "TOGGLE_STATE_BUTTON": {
                        cmdName = ctx.guild?.queue?.playing === true ? "pause" : "resume";
                        break;
                    }

                    case "SKIP_BUTTON": {
                        cmdName = "skip";
                        break;
                    }

                    case "SHOW_QUEUE_BUTTON": {
                        cmdName = "queue";
                        break;
                    }

                    case "STOP_BUTTON": {
                        cmdName = "stop";
                        break;
                    }

                    default:
                        break;
                }
                const cmd = client.commands.get(cmdName) as
                    | { contextRun?: (ctx: CommandContext) => Promise<unknown> }
                    | undefined;
                await cmd?.contextRun?.(newCtx as unknown as CommandContext);

                const embed = getEmbed();

                await msg.edit({ embeds: [embed] }).catch(() => null);
            })
            .on("end", async () => {
                clearInterval(updateInterval);

                const embed = getEmbed().setFooter({
                    text: `• ${__("commands.music.nowplaying.disableButton")}`,
                });

                await msg
                    .edit({
                        embeds: [embed],
                        components: [],
                    })
                    .catch(() => null);
            });
    }
}
