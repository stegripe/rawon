import { haveQueue, inVC, sameVC } from "../../utils/decorators/MusicUtil";
import { DefineCommand } from "../../utils/decorators/DefineCommand";
import { CommandContext } from "../../structures/CommandContext";
import { BaseCommand } from "../../structures/BaseCommand";
import { createEmbed } from "../../utils/createEmbed";
import i18n from "../../config";
import { Message } from "discord.js";

@DefineCommand({
    description: i18n.__("commands.music.resume.description"),
    name: "resume",
    slash: {
        options: []
    },
    usage: "{prefix}resume"
})
export class ResumeCommand extends BaseCommand {
    @inVC()
    @haveQueue()
    @sameVC()
    public execute(ctx: CommandContext): Promise<Message> {
        if (ctx.guild?.queue?.playing) return ctx.reply({ embeds: [createEmbed("error", i18n.__("commands.music.resume.alreadyResume"), true)] });
        ctx.guild!.queue!.playing = true;

        return ctx.reply({ embeds: [createEmbed("info", `▶ **|** ${i18n.__("commands.music.resume.resumeMessage")}`)] });
    }
}
