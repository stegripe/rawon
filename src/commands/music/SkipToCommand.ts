import { type AudioPlayerPlayingState } from "@discordjs/voice";
import { ApplicationCommandOptionType, type VoiceChannel } from "discord.js";
import i18n from "../../config/index.js";
import { BaseCommand } from "../../structures/BaseCommand.js";
import { type CommandContext } from "../../structures/CommandContext.js";
import { type QueueSong } from "../../typings/index.js";
import { Command } from "../../utils/decorators/Command.js";
import { haveQueue, inVC, sameVC } from "../../utils/decorators/MusicUtil.js";
import { createEmbed } from "../../utils/functions/createEmbed.js";
import { i18n__, i18n__mf } from "../../utils/functions/i18n.js";
import { play } from "../../utils/handlers/GeneralUtil.js";

@Command({
    aliases: ["st"],
    description: i18n.__("commands.music.skipTo.description"),
    name: "skipto",
    slash: {
        options: [
            {
                description: i18n.__("commands.music.skipTo.slashFirstDescription"),
                name: "first",
                type: ApplicationCommandOptionType.Subcommand,
            },
            {
                description: i18n.__("commands.music.skipTo.slashLastDescription"),
                name: "last",
                type: ApplicationCommandOptionType.Subcommand,
            },
            {
                description: i18n.__("commands.music.skipTo.slashSpecificDescription"),
                name: "specific",
                options: [
                    {
                        description: i18n.__("commands.music.skipTo.slashPositionDescription"),
                        name: "position",
                        required: true,
                        type: ApplicationCommandOptionType.Number,
                    },
                ],
                type: ApplicationCommandOptionType.Subcommand,
            },
        ],
    },
    usage: i18n.__mf("commands.music.skipTo.usage", { options: "first | last" }),
})
export class SkipToCommand extends BaseCommand {
    @inVC
    @haveQueue
    @sameVC
    public async execute(ctx: CommandContext): Promise<void> {
        const __ = i18n__(this.client, ctx.guild);
        const __mf = i18n__mf(this.client, ctx.guild);

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

        const djRole = await this.client.utils.fetchDJRole(
            ctx.guild as unknown as NonNullable<typeof ctx.guild>,
        );
        if (
            this.client.data.data?.[ctx.guild?.id ?? ""]?.dj?.enable === true &&
            (
                this.client.channels.cache.get(
                    queue.connection?.joinConfig.channelId ?? "",
                ) as VoiceChannel
            )?.members.size > 2 &&
            ctx.member?.roles.cache.has(djRole?.id ?? "") !== true &&
            ctx.member?.permissions.has("ManageGuild") !== true
        ) {
            await ctx.reply({
                embeds: [createEmbed("error", __("commands.music.skipTo.noPermission"), true)],
            });
            return;
        }

        const subcommand = ctx.options?.getSubcommand(false);
        let targetType: number | string;

        if (subcommand === "specific") {
            const position = ctx.options?.getNumber("position");
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
            const arg = ctx.args[0];
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
                            prefix: `**\`${this.client.config.mainPrefix}help\`**`,
                            name: `**\`${this.meta.name}\`**`,
                        }),
                    ),
                ],
            });
            return;
        }

        const songs = [...(queue.songs.sortByIndex().values() as unknown as QueueSong[])];
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

        if (
            song.key ===
            ((queue.player.state as AudioPlayerPlayingState).resource.metadata as QueueSong).key
        ) {
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
