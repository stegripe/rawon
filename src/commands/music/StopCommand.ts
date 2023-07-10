import { inVC, sameVC, validVC } from "../../utils/decorators/MusicUtil.js";
import { CommandContext } from "../../structures/CommandContext.js";
import { createEmbed } from "../../utils/functions/createEmbed.js";
import { BaseCommand } from "../../structures/BaseCommand.js";
import { Command } from "../../utils/decorators/Command.js";
import i18n from "../../config/index.js";

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
