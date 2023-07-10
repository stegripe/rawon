import { ButtonPagination } from "../../utils/structures/ButtonPagination.js";
import { CommandContext } from "../../structures/CommandContext.js";
import { createEmbed } from "../../utils/functions/createEmbed.js";
import { haveQueue } from "../../utils/decorators/MusicUtil.js";
import { BaseCommand } from "../../structures/BaseCommand.js";
import { Command } from "../../utils/decorators/Command.js";
import { chunk } from "../../utils/functions/chunk.js";
import { QueueSong } from "../../typings/index.js";
import i18n from "../../config/index.js";
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
        const embed = createEmbed("info", pages[0]).setThumbnail(ctx.guild!.iconURL({ extension: "png", size: 1024 }));
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
