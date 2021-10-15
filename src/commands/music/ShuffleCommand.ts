import { haveQueue, inVC, sameVC } from "../../utils/decorators/MusicUtil";
import { DefineCommand } from "../../utils/decorators/DefineCommand";
import { CommandContext } from "../../structures/CommandContext";
import { BaseCommand } from "../../structures/BaseCommand";
import { createEmbed } from "../../utils/createEmbed";
import i18n from "../../config";

@DefineCommand({
    description: i18n.__("commands.music.shuffle.description"),
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
    public execute(ctx: CommandContext): void {
        ctx.guild!.queue!.shuffle = !ctx.guild!.queue!.shuffle;
        const isShuffle = ctx.guild!.queue!.shuffle;
        void ctx.reply({ embeds: [createEmbed("info", `${isShuffle ? "🔀" : "▶"} **|** ${i18n.__mf("commands.music.shuffle.shuffleMessage", { isShuffle: `\`${isShuffle ? "ON" : "OFF"}\`` })}`)] });
    }
}
