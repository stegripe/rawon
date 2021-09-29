import { haveQueue, inVC, sameVC } from "../../utils/decorators/MusicUtil";
import { DefineCommand } from "../../utils/decorators/DefineCommand";
import { CommandContext } from "../../structures/CommandContext";
import { BaseCommand } from "../../structures/BaseCommand";
import { createEmbed } from "../../utils/createEmbed";
import i18n from "../../config";

@DefineCommand({
    description: i18n.__("commands.music.pause.description"),
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
        if (!ctx.guild?.queue?.playing) return ctx.reply({ embeds: [createEmbed("error", i18n.__("commands.music.pause.alreadyPause"), true)] });

        ctx.guild.queue.playing = false;

        return ctx.reply({ embeds: [createEmbed("info", `⏸ **|** ${i18n.__("commands.music.pause.pauseMessage")}`)] });
    }
}
