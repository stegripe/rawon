import i18n from "../../config/index.js";
import { BaseCommand } from "../../structures/BaseCommand.js";
import { CommandContext } from "../../structures/CommandContext.js";
import { Command } from "../../utils/decorators/Command.js";
import { haveQueue, inVC, sameVC, useRequestChannel } from "../../utils/decorators/MusicUtil.js";
import { createEmbed } from "../../utils/functions/createEmbed.js";

@Command({
    description: i18n.__("commands.music.pause.description"),
    name: "pause",
    slash: {
        options: []
    },
    usage: "{prefix}pause"
})
export class PauseCommand extends BaseCommand {
    @useRequestChannel
    @inVC
    @haveQueue
    @sameVC
    public async execute(ctx: CommandContext): Promise<void> {
        if (ctx.guild?.queue?.playing !== true) {
            await ctx.reply({
                embeds: [createEmbed("warn", i18n.__("commands.music.pause.alreadyPause"))]
            });

            return;
        }

        ctx.guild.queue.playing = false;

        await ctx.reply({
            embeds: [createEmbed("success", `⏸️ **|** ${i18n.__("commands.music.pause.pauseMessage")}`)]
        });
    }
}
