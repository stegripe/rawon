import { haveQueue, inVC, sameVC } from "../../utils/decorators/MusicUtil";
import { DefineCommand } from "../../utils/decorators/DefineCommand";
import { CommandContext } from "../../structures/CommandContext";
import { BaseCommand } from "../../structures/BaseCommand";
import { createEmbed } from "../../utils/createEmbed";

@DefineCommand({
    aliases: ["24/7"],
    description: "Makes the bot stay in VC when queue ended",
    name: "stayinvc",
    slash: {
        options: [
            {
                choices: [
                    {
                        name: "Enable",
                        value: "enable"
                    },
                    {
                        name: "Disable",
                        value: "disable"
                    }
                ],
                description: "Enable/disable stay-in-VC feature",
                name: "state",
                required: false,
                type: "STRING"
            }
        ]
    },
    usage: "{prefix}stayinvc [enable | disable]"
})
export class StayInQueueCommand extends BaseCommand {
    @inVC()
    @haveQueue()
    @sameVC()
    public execute(ctx: CommandContext): any {
        const newState = ctx.options?.getString("state") ?? ctx.args[0] as string|undefined;

        if (!newState) return ctx.reply({ embeds: [createEmbed("info", `Stay-in-VC is ${ctx.guild?.queue?.stayInVC ? "enabled" : "disabled"}.`)] });
        ctx.guild!.queue!.stayInVC = (newState === "enable");

        return ctx.reply({ embeds: [createEmbed("info", `Stay-in-VC is now ${ctx.guild?.queue?.stayInVC ? "enabled" : "disabled"}.`)] });
    }
}
