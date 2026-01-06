import { type AudioPlayerPlayingState } from "@discordjs/voice";
import i18n from "../../config/index.js";
import { BaseCommand } from "../../structures/BaseCommand.js";
import { type CommandContext } from "../../structures/CommandContext.js";
import { type QueueSong } from "../../typings/index.js";
import { Command } from "../../utils/decorators/Command.js";
import { haveQueue, inVC, sameVC } from "../../utils/decorators/MusicUtil.js";
import { chunk } from "../../utils/functions/chunk.js";
import { createEmbed } from "../../utils/functions/createEmbed.js";
import { i18n__, i18n__mf } from "../../utils/functions/i18n.js";
import { ButtonPagination } from "../../utils/structures/ButtonPagination.js";
import { type SongManager } from "../../utils/structures/SongManager.js";

@Command({
    aliases: ["q"],
    description: i18n.__("commands.music.queue.description"),
    name: "queue",
    slash: {
        options: [],
    },
    usage: "{prefix}queue",
})
export class QueueCommand extends BaseCommand {
    @inVC
    @haveQueue
    @sameVC
    public async execute(ctx: CommandContext): Promise<void> {
        const __ = i18n__(this.client, ctx.guild);
        const __mf = i18n__mf(this.client, ctx.guild);

        const np = (ctx.guild?.queue?.player.state as AudioPlayerPlayingState).resource
            .metadata as QueueSong;
        const full = ctx.guild?.queue?.songs.sortByIndex() as unknown as SongManager;
        const songs =
            ctx.guild?.queue?.loopMode === "QUEUE"
                ? full
                : full.filter((val) => val.index >= np.index);
        const pages = chunk([...songs.values()], 10).map((sngs, ind) => {
            const names = sngs.map((song, i) => {
                const npKey = np.key;
                const addition = song.key === npKey ? "**" : "";

                return `${addition}${ind * 10 + (i + 1)} - [${song.song.title}](${song.song.url})${addition}`;
            });

            return names.join("\n");
        });
        const embed = createEmbed("info", pages[0])
            .setTitle(`📋 ${__("requestChannel.queueListTitle")}`)
            .setThumbnail(ctx.guild?.iconURL({ extension: "png", size: 1_024 }) ?? null);
        const msg = await ctx.reply({ embeds: [embed] });

        return new ButtonPagination(msg, {
            author: ctx.author.id,
            edit: (i, emb, page) =>
                emb.setDescription(page).setFooter({
                    text: `• ${__mf("reusable.pageFooter", {
                        actual: i + 1,
                        total: pages.length,
                    })}`,
                }),
            embed,
            pages,
        }).start();
    }
}
