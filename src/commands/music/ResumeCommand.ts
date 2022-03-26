import { haveQueue, inVC, sameVC } from "../../utils/decorators/MusicUtil";
import { CommandContext } from "../../structures/CommandContext";
import { createEmbed } from "../../utils/functions/createEmbed";
import { BaseCommand } from "../../structures/BaseCommand";
import { Command } from "../../utils/decorators/Command";
import i18n from "../../config";
import { Message } from "discord.js";

@Command({
    description: i18n.__("commands.music.resume.description"),
    name: "resume",
    slash: {
        options: []
    },
    usage: "{prefix}resume"
})
export class ResumeCommand extends BaseCommand {
    @inVC
    @haveQueue
    @sameVC
    public execute(ctx: CommandContext): Promise<Message> | undefined {
        if (ctx.guild?.queue?.playing) {
            return ctx.reply({
                embeds: [createEmbed("warn", i18n.__("commands.music.resume.alreadyResume"))]
            });
        }
        ctx.guild!.queue!.playing = true;

        return ctx.reply({
            embeds: [createEmbed("success", `▶ **|** ${i18n.__("commands.music.resume.resumeMessage")}`)]
        });
    }
}
