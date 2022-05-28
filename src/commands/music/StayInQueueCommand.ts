import { haveQueue, inVC, sameVC } from "../../utils/decorators/MusicUtil";
import { CommandContext } from "../../structures/CommandContext";
import { createEmbed } from "../../utils/functions/createEmbed";
import { BaseCommand } from "../../structures/BaseCommand";
import { Command } from "../../utils/decorators/Command";
import i18n from "../../config";
import { Message } from "discord.js";

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
                type: "STRING"
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
