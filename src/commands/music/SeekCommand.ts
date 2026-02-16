/** biome-ignore-all lint/style/useNamingConvention: disable naming convention rule for this file */
import { type AudioPlayerPlayingState, AudioPlayerStatus } from "@discordjs/voice";
import { ApplyOptions } from "@sapphire/decorators";
import { type Command } from "@sapphire/framework";
import { type CommandContext, ContextCommand } from "@stegripe/command-context";
import { PermissionFlagsBits, type SlashCommandBuilder } from "discord.js";
import { enableAudioCache } from "../../config/env.js";
import i18n from "../../config/index.js";
import { type CommandContext as LocalCommandContext } from "../../structures/CommandContext.js";
import { type Rawon } from "../../structures/Rawon.js";
import { type QueueSong } from "../../typings/index.js";
import { haveQueue, inVC, sameVC } from "../../utils/decorators/MusicUtil.js";
import { createEmbed } from "../../utils/functions/createEmbed.js";
import { i18n__, i18n__mf } from "../../utils/functions/i18n.js";
import { normalizeTime } from "../../utils/functions/normalizeTime.js";
import { parseTime } from "../../utils/functions/parseTime.js";
import { checkQuery, play } from "../../utils/handlers/GeneralUtil.js";

@ApplyOptions<Command.Options>({
    name: "seek",
    aliases: ["sk"],
    description: i18n.__("commands.music.seek.description"),
    detailedDescription: { usage: i18n.__("commands.music.seek.usage") },
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
            .setName(opts.name ?? "seek")
            .setDescription(opts.description ?? i18n.__("commands.music.seek.description"))
            .addStringOption((opt) =>
                opt
                    .setName("time")
                    .setDescription(i18n.__("commands.music.seek.slashTimeDescription"))
                    .setRequired(true),
            ) as SlashCommandBuilder;
    },
})
export class SeekCommand extends ContextCommand {
    private getClient(ctx: CommandContext): Rawon {
        return ctx.client as Rawon;
    }

    @inVC
    @haveQueue
    @sameVC
    public async contextRun(ctx: CommandContext): Promise<void> {
        const localCtx = ctx as unknown as LocalCommandContext;
        const client = this.getClient(ctx);
        const __ = i18n__(client, ctx.guild);
        const __mf = i18n__mf(client, ctx.guild);

        const queue = ctx.guild?.queue;
        if (!queue) {
            return;
        }

        if (queue.player.state.status !== AudioPlayerStatus.Playing) {
            await ctx.reply({
                embeds: [createEmbed("warn", __("commands.music.seek.noPlaying"))],
            });
            return;
        }

        const song = (queue.player.state as AudioPlayerPlayingState).resource.metadata as QueueSong;

        if (song.song.isLive) {
            await ctx.reply({
                embeds: [createEmbed("error", __("commands.music.seek.cantSeekLive"), true)],
            });
            return;
        }

        const queryCheck = checkQuery(song.song.url);
        if (queryCheck.sourceType === "soundcloud") {
            await ctx.reply({
                embeds: [createEmbed("error", __("commands.music.seek.cantSeekSoundcloud"), true)],
            });
            return;
        }

        const timeArg = localCtx.args[0] ?? localCtx.options?.getString("time");
        if (!timeArg) {
            await ctx.reply({
                embeds: [createEmbed("warn", __("commands.music.seek.noTime"))],
            });
            return;
        }

        const seekSeconds = parseTime(timeArg);
        if (seekSeconds === null || seekSeconds < 0) {
            await ctx.reply({
                embeds: [
                    createEmbed(
                        "warn",
                        __mf("commands.music.seek.invalidTime", { time: `**\`${timeArg}\`**` }),
                    ),
                ],
            });
            return;
        }

        if (seekSeconds >= song.song.duration) {
            await ctx.reply({
                embeds: [
                    createEmbed(
                        "warn",
                        __mf("commands.music.seek.exceedsDuration", {
                            duration: `**\`${normalizeTime(song.song.duration)}\`**`,
                        }),
                    ),
                ],
            });
            return;
        }

        if (enableAudioCache && seekSeconds > 0) {
            const isCached = client.audioCache.isCached(song.song.url);
            const isInProgress = client.audioCache.isInProgress(song.song.url);

            if (!isCached && isInProgress) {
                await ctx.reply({
                    embeds: [createEmbed("warn", __("commands.music.seek.waitingForCache"))],
                });
                return;
            }

            if (!isCached && !isInProgress) {
                await ctx.reply({
                    embeds: [createEmbed("warn", __("commands.music.seek.notCached"))],
                });
                return;
            }
        }

        await ctx.reply({
            embeds: [
                createEmbed(
                    "success",
                    `⏩ **|** ${__mf("commands.music.seek.seeked", {
                        time: `**\`${normalizeTime(seekSeconds)}\`**`,
                    })}`,
                ),
            ],
        });

        queue.playing = false;
        void play(ctx.guild!, song.key, true, seekSeconds);
    }
}
