import i18n from "../../config/index.js";
import { BaseCommand } from "../../structures/BaseCommand.js";
import { CommandContext } from "../../structures/CommandContext.js";
import { Command } from "../../utils/decorators/Command.js";
import { inVC, sameVC, validVC } from "../../utils/decorators/MusicUtil.js";
import { createEmbed } from "../../utils/functions/createEmbed.js";
import { destroyStream, killProcess } from "../../utils/handlers/YTDLUtil.js";

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
    public async execute(ctx: CommandContext): Promise<void> {
        // Stop the music queue
        ctx.guild?.queue?.stop();

        // Clear the last music message
        (ctx.guild?.queue as unknown as NonNullable<NonNullable<typeof ctx.guild>["queue"]>).lastMusicMsg = null;

        // Destroy the audio stream and process
        destroyStream();
        killProcess();

        // Send a success message
        await ctx.reply({
            embeds: [createEmbed("success", `⏹ **|** ${i18n.__("commands.music.stop.stoppedMessage")}`)]
        }).catch((error: unknown) => this.client.logger.error("STOP_CMD_ERR:", error));
    }
}
