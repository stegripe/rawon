import { haveQueue, inVC, sameVC } from "../../utils/decorators/MusicUtil";
import { DefineCommand } from "../../utils/decorators/DefineCommand";
import { CommandContext } from "../../structures/CommandContext";
import { BaseCommand } from "../../structures/BaseCommand";
import { createEmbed } from "../../utils/createEmbed";

@DefineCommand({
    aliases: ["stayinvc", "stay", "24/7"],
    description: "Makes the bot stay in the voice channel when queue was ended",
    name: "stayinvoice",
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
                description: "Turns mode for stay-in-voice feature",
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
        if (!this.client.config.is247Allowed) return ctx.reply({ embeds: [createEmbed("warn", "Stay-in-voice feature is disabled.")] });

        const newState = ctx.options?.getString("state") ?? ctx.args[0] as string|undefined;

        if (!newState) return ctx.reply({ embeds: [createEmbed("info", `Stay-in-voice is **\`${ctx.guild?.queue?.stayInVC ? "ENABLED" : "DISABLED"}\`**`)] });

        ctx.guild!.queue!.stayInVC = (newState === "enable");

        return ctx.reply({ embeds: [createEmbed("info", `Stay-in-voice is now set to **\`${ctx.guild?.queue?.stayInVC ? "ENABLED" : "DISABLED"}\`**`)] });
    }
}
