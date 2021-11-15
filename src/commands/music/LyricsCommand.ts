import { CommandContext } from "../../structures/CommandContext";
import { ButtonPagination } from "../../utils/ButtonPagination";
import { ILyricsAPIResult, IQueueSong } from "../../typings";
import { BaseCommand } from "../../structures/BaseCommand";
import { createEmbed } from "../../utils/createEmbed";
import { chunk } from "../../utils/chunk";
import i18n from "../../config";
import { AudioPlayerPlayingState, AudioResource } from "@discordjs/voice";
import { Message } from "discord.js";

export class LyricsCommand extends BaseCommand {
    public constructor(client: BaseCommand["client"]) {
        super(client, {
            aliases: ["ly", "lyric"],
            description: i18n.__("commands.music.lyrics.description"),
            name: "lyrics",
            slash: {
                options: [
                    {
                        description: i18n.__("commands.music.lyrics.slashDescription"),
                        name: "query",
                        type: "STRING",
                        required: false
                    }
                ]
            },
            usage: i18n.__("commands.music.lyrics.usage")
        });
    }

    public execute(ctx: CommandContext): Promise<Message|void> {
        const query = ctx.args.length >= 1 ? ctx.args.join(" ") : ctx.options?.getString("query") ? ctx.options.getString("query") : ((((ctx.guild?.queue?.player?.state as AudioPlayerPlayingState).resource as AudioResource | undefined)?.metadata as IQueueSong | undefined)?.song.title);
        if (!query) return ctx.reply({ embeds: [createEmbed("error", i18n.__("commands.music.lyrics.noQuery"), true)] });

        return this.getLyrics(ctx, query);
    }

    private async getLyrics(ctx: CommandContext, song: string): Promise<void> {
        const url = `https://api.lxndr.dev/lyrics/?song=${encodeURI(song)}&from=${encodeURI(this.client.user!.id)}`;
        this.client.request.get(url).json<ILyricsAPIResult<false>>()
            .then(async data => {
                if ((data as { error: boolean }).error) {
                    return ctx.reply({ embeds: [createEmbed("error", i18n.__mf("commands.music.lyrics.apiError", { song: `\`${song}\``, message: `\`${(data as {message?: string}).message!}\`` }), true)] });
                }

                const albumArt = data.album_art ?? "https://api.zhycorp.net/assets/images/icon.png";
                const pages: string[] = chunk(data.lyrics as string, 2048);
                const embed = createEmbed("info", pages[0]).setAuthor(data.song && data.artist ? `${data.song} - ${data.artist}` : song.toUpperCase()).setThumbnail(albumArt);
                const msg = await ctx.reply({ embeds: [embed] });

                return (new ButtonPagination(msg, {
                    author: ctx.author.id,
                    edit: (i, e, p) => e.setDescription(p).setFooter(i18n.__mf("reusable.pageFooter", { actual: i + 1, total: pages.length })),
                    embed,
                    pages
                })).start();
            })
            .catch(error => console.error(error));
    }
}
