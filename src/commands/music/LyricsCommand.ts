import { AudioPlayerPlayingState, AudioResource } from "@discordjs/voice";
import { ApplicationCommandOptionType } from "discord.js";
import i18n from "../../config/index.js";
import { BaseCommand } from "../../structures/BaseCommand.js";
import { CommandContext } from "../../structures/CommandContext.js";
import { LyricsAPIResult, QueueSong } from "../../typings/index.js";
import { Command } from "../../utils/decorators/Command.js";
import { chunk } from "../../utils/functions/chunk.js";
import { createEmbed } from "../../utils/functions/createEmbed.js";
import { ButtonPagination } from "../../utils/structures/ButtonPagination.js";

@Command<typeof LyricsCommand>({
    aliases: ["ly", "lyric"],
    description: i18n.__("commands.music.lyrics.description"),
    name: "lyrics",
    slash: {
        options: [
            {
                description: i18n.__("commands.music.lyrics.slashDescription"),
                name: "query",
                type: ApplicationCommandOptionType.String,
                required: false
            }
        ]
    },
    usage: i18n.__("commands.music.lyrics.usage")
})
export class LyricsCommand extends BaseCommand {
    public async execute(ctx: CommandContext): Promise<void> {
        const query =
             
            ctx.args.length > 0
                ? ctx.args.join(" ")
                : (ctx.options?.getString("query")?.length ?? 0) > 0
                    ? ctx.options?.getString("query") ?? ""
                    : (
                        (
                            (ctx.guild?.queue?.player.state as AudioPlayerPlayingState).resource as
                            | AudioResource
                            | undefined
                        )?.metadata as QueueSong | undefined
                    )?.song.title;
        if ((query?.length ?? 0) === 0) {
            await ctx.reply({
                embeds: [createEmbed("error", i18n.__("commands.music.lyrics.noQuery"), true)]
            });

            return;
        }

        await this.getLyrics(ctx, query as unknown as string);
    }

    private async getLyrics(ctx: CommandContext, song: string): Promise<void> {
        const url = `https://api.lxndr.dev/lyrics?song=${encodeURIComponent(song)}&from=DiscordRawon`;
        
        try {
            const data = await this.client.request.get(url).json<LyricsAPIResult<false>>();
            
            if ((data as { error: boolean }).error) {
                await ctx.reply({
                    embeds: [
                        createEmbed(
                            "error",
                            i18n.__mf("commands.music.lyrics.apiError", {
                                song: `\`${song}\``,
                                message: `\`${(data as { message?: string }).message ?? "Unknown error"}\``
                            }),
                            true
                        )
                    ]
                });
                return;
            }

            if ((data.lyrics?.length ?? 0) === 0) {
                await ctx.reply({
                    embeds: [
                        createEmbed(
                            "warn",
                            i18n.__mf("commands.music.lyrics.noLyrics", {
                                song: `\`${song}\``
                            })
                        )
                    ]
                });
                return;
            }

            const albumArt = data.album_art ?? "https://cdn.stegripe.org/images/icon.png";
            const pages: string[] = chunk(data.lyrics ?? "", 2_048);
            const embed = createEmbed("info", pages[0])
                .setAuthor({
                    name: ((data.song?.length ?? 0) > 0) && ((data.artist?.length ?? 0) > 0) ? `${data.song} - ${data.artist}` : song.toUpperCase()
                })
                .setThumbnail(albumArt);
            const msg = await ctx.reply({ embeds: [embed] });

            await new ButtonPagination(msg, {
                author: ctx.author.id,
                edit: (i, emb, page) =>
                    emb.setDescription(page).setFooter({
                        text: i18n.__mf("reusable.pageFooter", {
                            actual: i + 1,
                            total: pages.length
                        })
                    }),
                embed,
                pages
            }).start();
        } catch (error) {
            this.client.logger.error("LYRICS_CMD_ERR:", error);
            await ctx.reply({
                embeds: [
                    createEmbed(
                        "error",
                        i18n.__mf("commands.music.lyrics.apiError", {
                            song: `\`${song}\``,
                            message: `\`${(error as Error).message ?? "Connection error"}\``
                        }),
                        true
                    )
                ]
            });
        }
    }
}
