import { type Message } from "discord.js";
import i18n from "../../config/index.js";
import { BaseCommand } from "../../structures/BaseCommand.js";
import { type CommandContext } from "../../structures/CommandContext.js";
import { Command } from "../../utils/decorators/Command.js";
import { haveQueue, inVC, sameVC, useRequestChannel } from "../../utils/decorators/MusicUtil.js";
import { createEmbed } from "../../utils/functions/createEmbed.js";
import { i18n__ } from "../../utils/functions/i18n.js";

@Command({
    description: i18n.__("commands.music.resume.description"),
    name: "resume",
    slash: {
        options: [],
    },
    usage: "{prefix}resume",
})
export class ResumeCommand extends BaseCommand {
    @useRequestChannel
    @inVC
    @haveQueue
    @sameVC
    public execute(ctx: CommandContext): Promise<Message> | undefined {
        const __ = i18n__(this.client, ctx.guild);

        if (ctx.guild?.queue?.playing === true) {
            return ctx.reply({
                embeds: [createEmbed("warn", __("commands.music.resume.alreadyResume"))],
            });
        }
        (
            ctx.guild?.queue as unknown as NonNullable<NonNullable<typeof ctx.guild>["queue"]>
        ).playing = true;

        return ctx.reply({
            embeds: [
                createEmbed("success", `▶️ **|** ${__("commands.music.resume.resumeMessage")}`),
            ],
        });
    }
}
