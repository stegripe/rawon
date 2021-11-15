import { haveQueue, inVC, sameVC } from "../../utils/decorators/MusicUtil";
import { CommandContext } from "../../structures/CommandContext";
import { BaseCommand } from "../../structures/BaseCommand";
import { createEmbed } from "../../utils/createEmbed";
import i18n from "../../config";
import { Message } from "discord.js";

export class ResumeCommand extends BaseCommand {
    public constructor(client: BaseCommand["client"]) {
        super(client, {
            description: i18n.__("commands.music.resume.description"),
            name: "resume",
            slash: {
                options: []
            },
            usage: "{prefix}resume"
        });
    }

    public execute(ctx: CommandContext): Promise<Message>|void {
        if (!inVC(ctx)) return;
        if (!haveQueue(ctx)) return;
        if (!sameVC(ctx)) return;
        if (ctx.guild?.queue?.playing) return ctx.reply({ embeds: [createEmbed("warn", i18n.__("commands.music.resume.alreadyResume"))] });
        ctx.guild!.queue!.playing = true;

        return ctx.reply({ embeds: [createEmbed("success", `▶ **|** ${i18n.__("commands.music.resume.resumeMessage")}`)] });
    }
}
