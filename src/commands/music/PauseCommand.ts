import { haveQueue, inVC, sameVC } from "../../utils/decorators/MusicUtil";
import { CommandContext } from "../../structures/CommandContext";
import { createEmbed } from "../../utils/functions/createEmbed";
import { BaseCommand } from "../../structures/BaseCommand";
import { Command } from "../../utils/decorators/Command";
import i18n from "../../config";
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
