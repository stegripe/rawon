import { inVC, sameVC, validVC } from "../../utils/decorators/MusicUtil";
import { CommandContext } from "../../structures/CommandContext";
import { createEmbed } from "../../utils/functions/createEmbed";
import { BaseCommand } from "../../structures/BaseCommand";
import { Command } from "../../utils/decorators/Command";
import i18n from "../../config";

@Command({
    aliases: ["disconnect", "dc"],
    description: i18n.__("commands.music.stop.description"),
    name: "stop",
    slash: {
        options: []
    },
    usage: "{prefix}stop"
})
export class StopCommand extends BaseCommand {
    @inVC
    @validVC
    @sameVC
    public execute(ctx: CommandContext): void {
        ctx.guild?.queue?.stop();
        ctx.guild!.queue!.lastMusicMsg = null;

        ctx.reply({
            embeds: [createEmbed("success", `⏹ **|** ${i18n.__("commands.music.stop.stoppedMessage")}`)]
        }).catch(e => this.client.logger.error("STOP_CMD_ERR:", e));
    }
}
