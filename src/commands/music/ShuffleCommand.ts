import { haveQueue, inVC, sameVC } from "../../utils/decorators/MusicUtil";
import { DefineCommand } from "../../utils/decorators/DefineCommand";
import { CommandContext } from "../../structures/CommandContext";
import { BaseCommand } from "../../structures/BaseCommand";
import { createEmbed } from "../../utils/createEmbed";

@DefineCommand({
    description: "Shuffle the queue",
    name: "shuffle",
    slash: {
        options: []
    },
    usage: "{prefix}shuffle"
})
export class ShuffleCommand extends BaseCommand {
    @inVC()
    @haveQueue()
    @sameVC()
    public execute(ctx: CommandContext): any {
        ctx.guild!.queue!.shuffle = !ctx.guild!.queue!.shuffle;
        const isShuffle = ctx.guild!.queue!.shuffle;
        return ctx.reply({ embeds: [createEmbed("info", `${isShuffle ? "🔀" : "▶"} **|** Shuffle mode is **\`${isShuffle ? "ON" : "OFF"}\`**`)] });
    }
}
