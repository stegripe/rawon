import { ButtonPagination } from "../../utils/structures/ButtonPagination.js";
import { CommandContext } from "../../structures/CommandContext.js";
import { LyricsAPIResult, QueueSong } from "../../typings/index.js";
import { createEmbed } from "../../utils/functions/createEmbed.js";
import { BaseCommand } from "../../structures/BaseCommand.js";
import { Command } from "../../utils/decorators/Command.js";
import { chunk } from "../../utils/functions/chunk.js";
import i18n from "../../config/index.js";
import { AudioPlayerPlayingState, AudioResource } from "@discordjs/voice";
import { ApplicationCommandOptionType, Message } from "discord.js";

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
    public execute(ctx: CommandContext): Promise<Message> | undefined {
        const query =
            // eslint-disable-next-line no-nested-ternary
            ctx.args.length >= 1
                ? ctx.args.join(" ")
                : ctx.options?.getString("query")
                    ? ctx.options.getString("query")
                    : (
                        (
                            (ctx.guild?.queue?.player.state as AudioPlayerPlayingState).resource as
                            | AudioResource
                            | undefined
                        )?.metadata as QueueSong | undefined
                    )?.song.title;
        if (!query) {
            return ctx.reply({
                embeds: [createEmbed("error", i18n.__("commands.music.lyrics.noQuery"), true)]
            });
        }

        this.getLyrics(ctx, query);
    }

    private getLyrics(ctx: CommandContext, song: string): void {
        const url = `https://api.lxndr.dev/lyrics?song=${encodeURI(song)}&from=DiscordRawon`;
        this.client.request
            .get(url)
            .json<LyricsAPIResult<false>>()
            .then(async data => {
                if ((data as { error: boolean }).error) {
                    return ctx.reply({
                        embeds: [
                            createEmbed(
                                "error",
                                i18n.__mf("commands.music.lyrics.apiError", {
                                    song: `\`${song}\``,
                                    message: `\`${(data as { message?: string }).message!}\``
                                }),
                                true
                            )
                        ]
                    });
                }

                const albumArt = data.album_art ?? "https://cdn.clytage.org/images/icon.png";
                const pages: string[] = chunk(data.lyrics!, 2048);
                const embed = createEmbed("info", pages[0])
                    .setAuthor({
                        name: data.song && data.artist ? `${data.song} - ${data.artist}` : song.toUpperCase()
                    })
                    .setThumbnail(albumArt);
                const msg = await ctx.reply({ embeds: [embed] });

                return new ButtonPagination(msg, {
                    author: ctx.author.id,
                    edit: (i, e, p) =>
                        e.setDescription(p).setFooter({
                            text: i18n.__mf("reusable.pageFooter", {
                                actual: i + 1,
                                total: pages.length
                            })
                        }),
                    embed,
                    pages
                }).start();
            })
            .catch(error => console.error(error));
    }
}
