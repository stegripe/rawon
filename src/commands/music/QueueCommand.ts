import { DefineCommand } from "../../utils/decorators/DefineCommand";
import { CommandContext } from "../../structures/CommandContext";
import { ButtonPagination } from "../../utils/ButtonPagination";
import { haveQueue } from "../../utils/decorators/MusicUtil";
import { BaseCommand } from "../../structures/BaseCommand";
import { createEmbed } from "../../utils/createEmbed";
import { IQueueSong } from "../../typings";
import { chunk } from "../../utils/chunk";
import { AudioPlayerPlayingState } from "@discordjs/voice";

@DefineCommand({
    aliases: ["q"],
    description: "Show the queue list",
    name: "queue",
    slash: {
        options: []
    },
    usage: "{prefix}queue"
})
export class QueueCommand extends BaseCommand {
    @haveQueue()
    public async execute(ctx: CommandContext): Promise<any> {
        const songs = ctx.guild!.queue!.songs.sortByIndex();
        const pages = await Promise.all(chunk([...songs.values()], 10).map(async (s, n) => {
            const names = await Promise.all(s.map((song, i) => {
                const npKey = ((ctx.guild!.queue!.player!.state as AudioPlayerPlayingState).resource.metadata as IQueueSong).key;
                const addition = song.key === npKey ? "**" : "";

                return `${addition}${(n * 10) + (i + 1)} - [${song.song.title}](${song.song.url})${addition}`;
            }));

            return names.join("\n");
        }));
        const embed = createEmbed("info", pages[0]);
        const msg = await ctx.reply({ embeds: [embed] });

        return (new ButtonPagination(msg, {
            author: ctx.author.id,
            edit: (i, e, p) => e.setDescription(p).setFooter(`Page ${i + 1} of ${pages.length}`),
            embed,
            pages
        })).start();
    }
}
