import { DefineCommand } from "../../utils/decorators/DefineCommand";
import { CommandContext } from "../../structures/CommandContext";
import { BaseCommand } from "../../structures/BaseCommand";
import { IQueueSong } from "../../typings";
import { ButtonPagination } from "../../utils/ButtonPagination";
import { createEmbed } from "../../utils/createEmbed";
import { AudioPlayerPlayingState } from "@discordjs/voice";
import fetch from "node-fetch";

@DefineCommand({
    aliases: ["ly"],
    description: "Show the lyrics from current/requested song",
    name: "lyrics",
    slash: {
        description: "Show the lyrics from current/requested song",
        name: "lyrics",
        options: [
            {
                description: "Song to search",
                name: "query",
                type: "STRING",
                required: false
            }
        ]
    },
    usage: "{prefix}lyrics [song]"
})
export class LyricsCommand extends BaseCommand {
    public execute(ctx: CommandContext): any {
        if (ctx.args.length >= 1) {
            void this.getLyrics(ctx, ctx.args.join(" "));
        } else {
            let song;
            try {
                song = ((ctx.guild!.queue!.player!.state as AudioPlayerPlayingState).resource.metadata as IQueueSong).song.title;
            } catch {
                return ctx.reply({ embeds: [createEmbed("error", "There is nothing playing or no args inserted")] });
            }
            void this.getLyrics(ctx, song);
        }
    }

    private async getLyrics(ctx: CommandContext, song: string): Promise<any> {
        const url = `https://api.lxndr.dev/lyrics/?song=${encodeURI(song)}&from=${encodeURI(this.client.user!.id)}`;
        void await fetch(url).then(
            response => response.json()
        ).then(async (data: any) => {
            if (data.error) {
                return ctx.reply({ embeds: [createEmbed("error", `The API could not find the song ${song}\n${data.message}`)] });
            }
            let lyrics: string = data.lyrics;
            let albumArt: string = data.album_art;
            const charLength: number = lyrics.length;
            let cantEmbeds = 0;

            if (charLength < 2048) {
                cantEmbeds = 1;
            } else {
                for (let i = 2; i < 10; i++) {
                    if (charLength < 2048 * i) {
                        cantEmbeds = i;
                        break;
                    }
                }
            }
            const lyricsArr: any = [];
            if (!albumArt) albumArt = "https://api.zhycorp.com/assets/images/logo.png";
            lyricsArr.push([lyrics.substring(0, 2047)]);
            lyrics = lyrics.replace(lyrics.substring(0, 2047), "");
            for (let i = 2; i <= cantEmbeds; i++) {
                lyricsArr.push([lyrics.substring(0, 2047)]);
                lyrics = lyrics.replace(lyrics.substring(0, 2048), "");
            }
            const pages: any = await Promise.all(lyricsArr.map(async (s: any) => s.join("\n")));

            const embed = createEmbed("info", pages[0]).setAuthor(`${data.song} - ${data.artist}`).setThumbnail(albumArt);
            const msg = await ctx.reply({ embeds: [embed] });
            return (new ButtonPagination(msg, {
                author: ctx.author.id,
                edit: (i, e, p) => e.setDescription(p).setFooter(`Page ${i + 1} of ${pages.length}`),
                embed,
                pages
            })).start();
        })
            .catch(error => console.error(error));
    }
}
