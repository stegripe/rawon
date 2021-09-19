import { DefineCommand } from "../../utils/decorators/DefineCommand";
import { haveQueue } from "../../utils/decorators/MusicUtil";
import { CommandContext } from "../../structures/CommandContext";
import { BaseCommand } from "../../structures/BaseCommand";
import { createEmbed } from "../../utils/createEmbed";

@DefineCommand({
    aliases: ["s"],
    description: "Skip currently playing music",
    name: "skip",
    slash: {
        name: "skip"
    },
    usage: "{prefix}skip"
})
export class SkipCommand extends BaseCommand {
    @haveQueue()
    public execute(ctx: CommandContext): any {
        const song = ctx.guild!.queue!.songs.first()!;

        if (!ctx.guild?.queue?.playing) ctx.guild!.queue!.playing = true;
        ctx.guild?.queue?.player?.stop(true);

        ctx.reply({ embeds: [createEmbed("info", `⏭ **|** Skipped **[${song.song.title}](${song.song.url}})**`).setThumbnail(song.song.thumbnail)] }).catch(e => this.client.logger.error("SKIP_CMD_ERR:", e));
    }
}
