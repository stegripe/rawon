import { CommandContext } from "../../structures/CommandContext";
import { ButtonPagination } from "../../utils/ButtonPagination";
import { haveQueue } from "../../utils/decorators/MusicUtil";
import { BaseCommand } from "../../structures/BaseCommand";
import { createEmbed } from "../../utils/createEmbed";
import { IQueueSong } from "../../typings";
import { chunk } from "../../utils/chunk";
import i18n from "../../config";
import { AudioPlayerPlayingState } from "@discordjs/voice";

export class QueueCommand extends BaseCommand {
    public constructor(client: BaseCommand["client"]) {
        super(client, {
            aliases: ["q"],
            description: i18n.__("commands.music.queue.description"),
            name: "queue",
            slash: {
                options: []
            },
            usage: "{prefix}queue"
        });
    }

    public async execute(ctx: CommandContext): Promise<void> {
        if (!haveQueue(ctx)) return;

        const np = (ctx.guild!.queue!.player!.state as AudioPlayerPlayingState).resource.metadata as IQueueSong;
        const full = ctx.guild!.queue!.songs.sortByIndex();
        const songs = ctx.guild?.queue?.loopMode === "QUEUE" ? full : full.filter(val => val.index >= np.index);
        const pages = await Promise.all(chunk([...songs.values()], 10).map(async (s, n) => {
            const names = await Promise.all(s.map((song, i) => {
                const npKey = np.key;
                const addition = song.key === npKey ? "**" : "";

                return `${addition}${(n * 10) + (i + 1)} - [${song.song.title}](${song.song.url})${addition}`;
            }));

            return names.join("\n");
        }));
        const embed = createEmbed("info", pages[0]);
        const msg = await ctx.reply({ embeds: [embed] });

        return (new ButtonPagination(msg, {
            author: ctx.author.id,
            edit: (i, e, p) => e.setDescription(p).setFooter(i18n.__mf("reusable.pageFooter", { actual: i + 1, total: pages.length })),
            embed,
            pages
        })).start();
    }
}
