import { haveQueue, inVC, sameVC } from "../../utils/decorators/MusicUtil";
import { DefineCommand } from "../../utils/decorators/DefineCommand";
import { CommandContext } from "../../structures/CommandContext";
import { BaseCommand } from "../../structures/BaseCommand";
import { createEmbed } from "../../utils/createEmbed";

@DefineCommand({
    description: "Resume the music player",
    name: "resume",
    slash: {
        options: []
    },
    usage: "{prefix}resume"
})
export class ResumeCommand extends BaseCommand {
    @inVC()
    @haveQueue()
    @sameVC()
    public execute(ctx: CommandContext): any {
        if (ctx.guild?.queue?.playing) return ctx.reply({ embeds: [createEmbed("error", "The music player is not paused.", true)] });
        ctx.guild!.queue!.playing = true;

        return ctx.reply({ embeds: [createEmbed("info", "▶ **|** The music player has been resumed.")] });
    }
}
