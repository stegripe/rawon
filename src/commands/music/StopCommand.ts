import { inVC, sameVC, validVC } from "../../utils/decorators/MusicUtil";
import { CommandContext } from "../../structures/CommandContext";
import { BaseCommand } from "../../structures/BaseCommand";
import { createEmbed } from "../../utils/createEmbed";
import i18n from "../../config";

export class StopCommand extends BaseCommand {
    public constructor(client: BaseCommand["client"]) {
        super(client, {
            aliases: ["disconnect", "dc"],
            description: i18n.__("commands.music.stop.description"),
            name: "stop",
            slash: {
                options: []
            },
            usage: "{prefix}stop"
        });
    }

    public execute(ctx: CommandContext): void {
        if (!inVC(ctx)) return;
        if (!validVC(ctx)) return;
        if (!sameVC(ctx)) return;

        ctx.guild?.queue?.stop();
        ctx.guild!.queue!.lastMusicMsg = null;

        ctx.reply({ embeds: [createEmbed("success", `⏹ **|** ${i18n.__("commands.music.stop.stoppedMessage")}`)] }).catch(e => this.client.logger.error("STOP_CMD_ERR:", e));
    }
}
