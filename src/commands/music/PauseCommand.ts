import i18n from "../../config/index.js";
import { BaseCommand } from "../../structures/BaseCommand.js";
import { type CommandContext } from "../../structures/CommandContext.js";
import { Command } from "../../utils/decorators/Command.js";
import { haveQueue, inVC, sameVC, useRequestChannel } from "../../utils/decorators/MusicUtil.js";
import { createEmbed } from "../../utils/functions/createEmbed.js";
import { i18n__ } from "../../utils/functions/i18n.js";

@Command({
    description: i18n.__("commands.music.pause.description"),
    name: "pause",
    slash: {
        options: [],
    },
    usage: "{prefix}pause",
})
export class PauseCommand extends BaseCommand {
    @useRequestChannel
    @inVC
    @haveQueue
    @sameVC
    public async execute(ctx: CommandContext): Promise<void> {
        const __ = i18n__(this.client, ctx.guild);

        if (ctx.guild?.queue?.playing !== true) {
            await ctx.reply({
                embeds: [createEmbed("warn", __("commands.music.pause.alreadyPause"))],
            });

            return;
        }

        ctx.guild.queue.playing = false;

        await ctx.reply({
            embeds: [createEmbed("success", `⏸️ **|** ${__("commands.music.pause.pauseMessage")}`)],
        });
    }
}
