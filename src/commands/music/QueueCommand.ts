import { ButtonPagination } from "../../utils/structures/ButtonPagination";
import { CommandContext } from "../../structures/CommandContext";
import { createEmbed } from "../../utils/functions/createEmbed";
import { haveQueue } from "../../utils/decorators/MusicUtil";
import { BaseCommand } from "../../structures/BaseCommand";
import { Command } from "../../utils/decorators/Command";
import { chunk } from "../../utils/functions/chunk";
import { QueueSong } from "../../typings";
import i18n from "../../config";
import { AudioPlayerPlayingState } from "@discordjs/voice";

@Command({
    aliases: ["q"],
    description: i18n.__("commands.music.queue.description"),
    name: "queue",
    slash: {
        options: []
    },
    usage: "{prefix}queue"
})
export class QueueCommand extends BaseCommand {
    @haveQueue
    public async execute(ctx: CommandContext): Promise<void> {
        const np = (ctx.guild!.queue!.player.state as AudioPlayerPlayingState).resource.metadata as QueueSong;
        const full = ctx.guild!.queue!.songs.sortByIndex();
        const songs = ctx.guild?.queue?.loopMode === "QUEUE" ? full : full.filter(val => val.index >= np.index);
        const pages = await Promise.all(
            chunk([...songs.values()], 10).map(async (s, n) => {
                const names = await Promise.all(
                    s.map((song, i) => {
                        const npKey = np.key;
                        const addition = song.key === npKey ? "**" : "";

                        return `${addition}${n * 10 + (i + 1)} - [${song.song.title}](${song.song.url})${addition}`;
                    })
                );

                return names.join("\n");
            })
        );
        const embed = createEmbed("info", pages[0]).setThumbnail(
            ctx.guild!.iconURL({ dynamic: true, format: "png", size: 1024 })!
        );
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
    }
}
