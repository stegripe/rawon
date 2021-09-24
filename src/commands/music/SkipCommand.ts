import { haveQueue, inVC, sameVC } from "../../utils/decorators/MusicUtil";
import { DefineCommand } from "../../utils/decorators/DefineCommand";
import { CommandContext } from "../../structures/CommandContext";
import { BaseCommand } from "../../structures/BaseCommand";
import { createEmbed } from "../../utils/createEmbed";

@DefineCommand({
    aliases: ["s"],
    description: "Skip the track",
    name: "skip",
    slash: {
    },
    usage: "{prefix}skip"
})
export class SkipCommand extends BaseCommand {
    @inVC()
    @haveQueue()
    @sameVC()
    public execute(ctx: CommandContext): any {
        const song = ctx.guild!.queue!.songs.first()!;

        if (!ctx.guild?.queue?.playing) ctx.guild!.queue!.playing = true;
        ctx.guild?.queue?.player?.stop(true);
        void ctx.reply({ embeds: [createEmbed("info", `⏭ **|** Skipped **[${song.song.title}](${song.song.url}})**`).setThumbnail(song.song.thumbnail)] }).catch(e => this.client.logger.error("SKIP_CMD_ERR:", e));
    }
}
