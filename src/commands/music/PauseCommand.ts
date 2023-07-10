import { haveQueue, inVC, sameVC } from "../../utils/decorators/MusicUtil.js";
import { CommandContext } from "../../structures/CommandContext.js";
import { createEmbed } from "../../utils/functions/createEmbed.js";
import { BaseCommand } from "../../structures/BaseCommand.js";
import { Command } from "../../utils/decorators/Command.js";
import i18n from "../../config/index.js";
import { Message } from "discord.js";

@Command({
    description: i18n.__("commands.music.pause.description"),
    name: "pause",
    slash: {
        options: []
    },
    usage: "{prefix}pause"
})
export class PauseCommand extends BaseCommand {
    @inVC
    @haveQueue
    @sameVC
    public execute(ctx: CommandContext): Promise<Message> | undefined {
        if (!ctx.guild?.queue?.playing) {
            return ctx.reply({
                embeds: [createEmbed("warn", i18n.__("commands.music.pause.alreadyPause"))]
            });
        }

        ctx.guild.queue.playing = false;

        return ctx.reply({
            embeds: [createEmbed("success", `⏸ **|** ${i18n.__("commands.music.pause.pauseMessage")}`)]
        });
    }
}
