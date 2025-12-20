import i18n from "../../config/index.js";
import { BaseCommand } from "../../structures/BaseCommand.js";
import { type CommandContext } from "../../structures/CommandContext.js";
import { Command } from "../../utils/decorators/Command.js";
import {
    haveQueue,
    inVC,
    sameVC,
    useRequestChannel,
    validVC,
} from "../../utils/decorators/MusicUtil.js";
import { createEmbed } from "../../utils/functions/createEmbed.js";

@Command({
    aliases: ["disconnect", "dc"],
    description: i18n.__("commands.music.stop.description"),
    name: "stop",
    slash: {
        options: [],
    },
    usage: "{prefix}stop",
})
export class StopCommand extends BaseCommand {
    @useRequestChannel
    @inVC
    @validVC
    @haveQueue
    @sameVC
    public async execute(ctx: CommandContext): Promise<void> {
        ctx.guild?.queue?.stop();
        (
            ctx.guild?.queue as unknown as NonNullable<NonNullable<typeof ctx.guild>["queue"]>
        ).lastMusicMsg = null;

        await ctx
            .reply({
                embeds: [
                    createEmbed(
                        "success",
                        `⏹️ **|** ${i18n.__("commands.music.stop.stoppedMessage")}`,
                    ),
                ],
            })
            .catch((error: unknown) => this.client.logger.error("STOP_CMD_ERR:", error));
    }
}
