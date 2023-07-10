import { haveQueue, inVC, sameVC } from "../../utils/decorators/MusicUtil.js";
import { CommandContext } from "../../structures/CommandContext.js";
import { createEmbed } from "../../utils/functions/createEmbed.js";
import { BaseCommand } from "../../structures/BaseCommand.js";
import { Command } from "../../utils/decorators/Command.js";
import i18n from "../../config/index.js";
import { ApplicationCommandOptionType, Message } from "discord.js";

@Command({
    aliases: ["stayinvc", "stay", "24/7"],
    description: i18n.__("commands.music.stayInQueue.description"),
    name: "stayinvoice",
    slash: {
        options: [
            {
                choices: [
                    {
                        name: "ENABLE",
                        value: "enable"
                    },
                    {
                        name: "DISABLE",
                        value: "disable"
                    }
                ],
                description: i18n.__("commands.music.stayInQueue.slashDescription"),
                name: "state",
                required: false,
                type: ApplicationCommandOptionType.String
            }
        ]
    },
    usage: "{prefix}stayinvc [enable | disable]"
})
export class StayInQueueCommand extends BaseCommand {
    @inVC
    @haveQueue
    @sameVC
    public execute(ctx: CommandContext): Promise<Message> | undefined {
        if (!this.client.config.is247Allowed) {
            return ctx.reply({
                embeds: [createEmbed("error", i18n.__("commands.music.stayInQueue.247Disabled"), true)]
            });
        }

        const newState = ctx.options?.getString("state") ?? (ctx.args[0] as string | undefined);

        if (!newState) {
            return ctx.reply({
                embeds: [
                    createEmbed(
                        "info",
                        `🔊 **|** ${i18n.__mf("commands.music.stayInQueue.actualState", {
                            state: `\`${ctx.guild?.queue?.stayInVC ? "ENABLED" : "DISABLED"}\``
                        })}`
                    )
                ]
            });
        }

        ctx.guild!.queue!.stayInVC = newState === "enable";

        return ctx.reply({
            embeds: [
                createEmbed(
                    "success",
                    `🔊 **|** ${i18n.__mf("commands.music.stayInQueue.newState", {
                        state: `\`${ctx.guild?.queue?.stayInVC ? "ENABLED" : "DISABLED"}\``
                    })}`,
                    true
                )
            ]
        });
    }
}
