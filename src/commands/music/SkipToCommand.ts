/** biome-ignore-all lint/style/useNamingConvention: disable naming convention rule for this file */

import { type AudioPlayerPlayingState, AudioPlayerStatus } from "@discordjs/voice";
import { ApplyOptions } from "@sapphire/decorators";
import { type Command } from "@sapphire/framework";
import { type CommandContext, ContextCommand } from "@stegripe/command-context";
import {
    type GuildMember,
    PermissionFlagsBits,
    type SlashCommandBuilder,
    type VoiceChannel,
} from "discord.js";
import i18n from "../../config/index.js";
import { type CommandContext as LocalCommandContext } from "../../structures/CommandContext.js";
import { type Rawon } from "../../structures/Rawon.js";
import { type QueueSong } from "../../typings/index.js";
import { haveQueue, inVC, sameVC, useRequestChannel } from "../../utils/decorators/MusicUtil.js";
import { createEmbed } from "../../utils/functions/createEmbed.js";
import { i18n__, i18n__mf } from "../../utils/functions/i18n.js";
import { play } from "../../utils/handlers/GeneralUtil.js";

@ApplyOptions<Command.Options>({
    name: "skipto",
    aliases: ["st"],
    description: i18n.__("commands.music.skipTo.description"),
    detailedDescription: {
        usage: i18n.__mf("commands.music.skipTo.usage", { options: "first | last" }),
    },
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
            .setName(opts.name ?? "skipto")
            .setDescription(opts.description ?? "Skip to a specific position in the queue.")
            .addSubcommand((sub) =>
                sub
                    .setName("first")
                    .setDescription(i18n.__("commands.music.skipTo.slashFirstDescription")),
            )
            .addSubcommand((sub) =>
                sub
                    .setName("last")
                    .setDescription(i18n.__("commands.music.skipTo.slashLastDescription")),
            )
            .addSubcommand((sub) =>
                sub
                    .setName("specific")
                    .setDescription(i18n.__("commands.music.skipTo.slashSpecificDescription"))
                    .addNumberOption((opt) =>
                        opt
                            .setName("position")
                            .setDescription(
                                i18n.__("commands.music.skipTo.slashPositionDescription"),
                            )
                            .setRequired(true),
                    ),
            ) as SlashCommandBuilder;
    },
})
export class SkipToCommand extends ContextCommand {
    private getClient(ctx: CommandContext): Rawon {
        return ctx.client as Rawon;
    }

    @useRequestChannel
    @inVC
    @haveQueue
    @sameVC
    public async contextRun(ctx: CommandContext): Promise<void> {
        const localCtx = ctx as unknown as LocalCommandContext;
        const member = localCtx.member as GuildMember | null;
        const client = this.getClient(ctx);
        const __ = i18n__(client, ctx.guild);
        const __mf = i18n__mf(client, ctx.guild);

        const queue = ctx.guild?.queue;
        if (!queue) {
            return;
        }

        if (!queue.canSkip()) {
            await ctx.reply({
                embeds: [createEmbed("warn", __("requestChannel.skipInProgress"))],
            });
            return;
        }

        const djRole = await client.utils.fetchDJRole(
            ctx.guild as unknown as NonNullable<typeof ctx.guild>,
        );
        if (
            client.data.data?.[ctx.guild?.id ?? ""]?.dj?.enable === true &&
            (
                client.channels.cache.get(
                    queue.connection?.joinConfig.channelId ?? "",
                ) as VoiceChannel
            )?.members.size > 2 &&
            member?.roles.cache.has(djRole?.id ?? "") !== true &&
            member?.permissions.has("ManageGuild") !== true
        ) {
            await ctx.reply({
                embeds: [createEmbed("error", __("commands.music.skipTo.noPermission"), true)],
            });
            return;
        }

        const subcommand = localCtx.options?.getSubcommand(false);
        let targetType: number | string;

        if (subcommand === "specific") {
            const position = localCtx.options?.getNumber("position");
            if (typeof position !== "number" || Number.isNaN(position)) {
                await ctx.reply({
                    embeds: [
                        createEmbed("error", __("commands.music.skipTo.invalidPosition"), true),
                    ],
                });
                return;
            }
            targetType = position;
        } else if (subcommand === "first" || subcommand === "last") {
            targetType = subcommand;
        } else {
            const arg = localCtx.args[0];
            targetType = Number.isNaN(Number(arg)) ? arg : Number(arg);
        }

        if (
            (typeof targetType === "string" && targetType.trim() === "") ||
            (typeof targetType === "number" && (Number.isNaN(targetType) || targetType <= 0))
        ) {
            await ctx.reply({
                embeds: [
                    createEmbed(
                        "warn",
                        __mf("reusable.invalidUsage", {
                            prefix: `**\`${client.config.mainPrefix}help\`**`,
                            name: `**\`${this.options.name}\`**`,
                        }),
                    ),
                ],
            });
            return;
        }

        if (queue.player.state.status !== AudioPlayerStatus.Playing) {
            await ctx.reply({
                embeds: [createEmbed("warn", __("utils.musicDecorator.notPlaying"))],
            });
            return;
        }
        const np = (queue.player.state as AudioPlayerPlayingState).resource.metadata as QueueSong;
        const fullSongs = [...(queue.songs.sortByIndex().values() as unknown as QueueSong[])];
        const songs =
            queue.loopMode === "QUEUE"
                ? fullSongs
                : fullSongs.filter((val) => val.index >= np.index);

        if (
            !["first", "last"].includes(String(targetType).toLowerCase()) &&
            !Number.isNaN(Number(targetType)) &&
            songs[Number(targetType) - 1] === undefined
        ) {
            await ctx.reply({
                embeds: [createEmbed("error", __("commands.music.skipTo.noSongPosition"), true)],
            });
            return;
        }

        let song: QueueSong;
        if (typeof targetType === "string") {
            const lower = targetType.toLowerCase();
            if (lower === "first") {
                song = songs[0];
            } else if (lower === "last") {
                const lastSong = songs.at(-1);
                if (!lastSong) {
                    await ctx.reply({
                        embeds: [
                            createEmbed("error", __("commands.music.skipTo.noSongPosition"), true),
                        ],
                    });
                    return;
                }
                song = lastSong;
            } else {
                await ctx.reply({
                    embeds: [
                        createEmbed("error", __("commands.music.skipTo.noSongPosition"), true),
                    ],
                });
                return;
            }
        } else {
            song = songs[targetType - 1];
        }

        if (song.key === np.key) {
            await ctx.reply({
                embeds: [createEmbed("error", __("commands.music.skipTo.cantPlay"), true)],
            });
            return;
        }

        if (!queue.startSkip()) {
            await ctx.reply({
                embeds: [createEmbed("warn", __("requestChannel.skipInProgress"))],
            });
            return;
        }

        void play(ctx.guild as unknown as NonNullable<typeof ctx.guild>, song.key);

        await ctx.reply({
            embeds: [
                createEmbed(
                    "success",
                    `⏭️ **|** ${__mf("commands.music.skipTo.skipMessage", {
                        song: `**[${song.song.title}](${song.song.url})**`,
                    })}`,
                ).setThumbnail(song.song.thumbnail),
            ],
        });
    }
}
