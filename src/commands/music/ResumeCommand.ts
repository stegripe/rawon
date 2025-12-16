import { Message } from "discord.js";
import i18n from "../../config/index.js";
import { BaseCommand } from "../../structures/BaseCommand.js";
import { CommandContext } from "../../structures/CommandContext.js";
import { Command } from "../../utils/decorators/Command.js";
import { haveQueue, inVC, sameVC, useRequestChannel } from "../../utils/decorators/MusicUtil.js";
import { createEmbed } from "../../utils/functions/createEmbed.js";

@Command({
    description: i18n.__("commands.music.resume.description"),
    name: "resume",
    slash: {
        options: []
    },
    usage: "{prefix}resume"
})
export class ResumeCommand extends BaseCommand {
    @useRequestChannel
    @inVC
    @haveQueue
    @sameVC
    public execute(ctx: CommandContext): Promise<Message> | undefined {
        if (ctx.guild?.queue?.playing === true) {
            return ctx.reply({
                embeds: [createEmbed("warn", i18n.__("commands.music.resume.alreadyResume"))]
            });
        }
        (ctx.guild?.queue as unknown as NonNullable<NonNullable<typeof ctx.guild>["queue"]>).playing = true;

        return ctx.reply({
            embeds: [createEmbed("success", `▶ **|** ${i18n.__("commands.music.resume.resumeMessage")}`)]
        });
    }
}
