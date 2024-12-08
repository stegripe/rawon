import { AudioPlayerPlayingState } from "@discordjs/voice";
import { ApplicationCommandOptionType, VoiceChannel } from "discord.js";
import i18n from "../../config/index.js";
import { BaseCommand } from "../../structures/BaseCommand.js";
import { CommandContext } from "../../structures/CommandContext.js";
import { QueueSong } from "../../typings/index.js";
import { Command } from "../../utils/decorators/Command.js";
import { haveQueue, inVC, sameVC } from "../../utils/decorators/MusicUtil.js";
import { createEmbed } from "../../utils/functions/createEmbed.js";
import { play } from "../../utils/handlers/GeneralUtil.js";
import { destroyStream, killProcess } from "../../utils/handlers/YTDLUtil.js";

@Command({

    aliases: ["st"],
    description: i18n.__("commands.music.skipTo.description"),
    name: "skipto",
    slash: {
        
        options: [
            {
                description: i18n.__("commands.music.skipTo.slashFirstDescription"),
                name: "first",
                type: ApplicationCommandOptionType.Subcommand
            },
            {
                description: i18n.__("commands.music.skipTo.slashLastDescription"),
                name: "last",
                type: ApplicationCommandOptionType.Subcommand
            },
            {
                description: i18n.__("commands.music.skipTo.slashSpecificDescription"),
                name: "specific",
                options: [
                    {
                        description: i18n.__("commands.music.skipTo.slashPositionDescription"),
                        name: "position",
                        required: true,
                        type: ApplicationCommandOptionType.Number
                    }
                ],
                type: ApplicationCommandOptionType.Subcommand
            }
        ]
    },
    usage: i18n.__mf("commands.music.skipTo.usage", { options: "first | last" })
})
export class SkipToCommand extends BaseCommand {
    @inVC
    @haveQueue
    @sameVC

    public async execute(ctx: CommandContext): Promise<void> {

        const djRole = await this.client.utils.fetchDJRole(ctx.guild as unknown as NonNullable<typeof ctx.guild>);
        const queue = ctx.guild?.queue;

        if (
            (this.client.data.data?.[ctx.guild?.id ?? ""]?.dj?.enable === true) &&
            (this.client.channels.cache.get(
                queue?.connection?.joinConfig.channelId ?? ""
            ) as VoiceChannel)?.members.size > 2 &&
            (ctx.member?.roles.cache.has(djRole?.id ?? "") !== true) &&
            (ctx.member?.permissions.has("ManageGuild") !== true)
        ) {
            await ctx.reply({
                embeds: [createEmbed("error", i18n.__("commands.music.skipTo.noPermission"), true)]
            });
            return;
        }

        const subcommand = ctx.options?.getSubcommand(false);
        const position = ctx.options?.getNumber("position", false);
        
        let targetType: number | string | undefined;
        if (subcommand === "specific") {
            targetType = position ?? Number.NaN;
        } else if (ctx.args.length > 0 && !Number.isNaN(Number(ctx.args[0]))) {
            targetType = Number(ctx.args[0]);
        } else {
            targetType = subcommand ?? ctx.args[0];
        }
        
        if (
            typeof targetType !== "string" &&
            (Number.isNaN(targetType) || targetType <= 0)
        ) {
            await ctx.reply({
                embeds: [
                    createEmbed(
                        "warn",
                        i18n.__mf("reusable.invalidUsage", {
                            prefix: `${this.client.config.mainPrefix}help`,
                            name: this.meta.name
                        })
                    )
                ]
            });
            return;
        }
        
        if (!queue || queue.songs.size === 0) {
            await ctx.reply({
                embeds: [createEmbed("error", i18n.__("commands.music.skipTo.noSongsRemaining"), true)]
            });
            return;
        }

        const songs = [...(queue.songs.sortByIndex().values() as unknown as QueueSong[])];

        let song: QueueSong | undefined;
        if (typeof targetType === "string") {
            if (targetType.toLowerCase() === "first") {
                song = songs[0];
            } else if (targetType.toLowerCase() === "last") {
                song = songs.at(-1);
            }
        } else {
            const index = targetType - 1; // Convert to zero-based index
            if (index >= 0 && index < songs.length) {
                song = songs[index];
            }
        }

        if (!song) {
            await ctx.reply({
                embeds: [createEmbed("error", i18n.__("commands.music.skipTo.noSongPosition"), true)]
            });
            return;
        }

        const currentSong = (queue.player.state as AudioPlayerPlayingState).resource?.metadata as QueueSong | undefined;

        if (currentSong && song.key === currentSong.key) {
            await ctx.reply({
                embeds: [createEmbed("error", i18n.__("commands.music.skipTo.cantPlay"), true)]
            });
            return;
        }

        // Clean up the current stream and process
        destroyStream();
        killProcess();

        if (!ctx.guild) {
            await ctx.reply({
                embeds: [createEmbed("error", i18n.__("commands.music.skipTo.noGuild"), true)]
            });
            return;
        }
        
        await play(ctx.guild, song.key);
        

        await ctx.reply({
            embeds: [
                createEmbed(
                    "success",
                    `⏭ **|** ${i18n.__mf("commands.music.skipTo.skipMessage", {
                        song: `[${song.song.title}](${song.song.url})`
                    })}`
                ).setThumbnail(song.song.thumbnail)
            ]
        });
    }
}
