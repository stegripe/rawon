import { haveQueue, inVC, sameVC } from "../../utils/decorators/MusicUtil";
import { DefineCommand } from "../../utils/decorators/DefineCommand";
import { CommandContext } from "../../structures/CommandContext";
import { BaseCommand } from "../../structures/BaseCommand";
import { createEmbed } from "../../utils/createEmbed";

@DefineCommand({
    description: "Pause the music player",
    name: "pause",
    slash: {
        name: "pause"
    },
    usage: "{prefix}pause"
})
export class PauseCommand extends BaseCommand {
    @inVC()
    @haveQueue()
    @sameVC()
    public execute(ctx: CommandContext): any {
        if (!ctx.guild?.queue?.playing) return ctx.reply({ embeds: [createEmbed("error", "The music player is already paused.", true)] });

        ctx.guild.queue.playing = false;

        return ctx.reply({ embeds: [createEmbed("info", "⏸ **|** The music player has been paused.")] });
    }
}
