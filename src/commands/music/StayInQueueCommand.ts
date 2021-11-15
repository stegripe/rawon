import { haveQueue, inVC, sameVC } from "../../utils/decorators/MusicUtil";
import { CommandContext } from "../../structures/CommandContext";
import { BaseCommand } from "../../structures/BaseCommand";
import { createEmbed } from "../../utils/createEmbed";
import i18n from "../../config";
import { Message } from "discord.js";

export class StayInQueueCommand extends BaseCommand {
    public constructor(client: BaseCommand["client"]) {
        super(client, {
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
        });
    }

    public execute(ctx: CommandContext): Promise<Message>|void {
        if (!inVC(ctx)) return;
        if (!haveQueue(ctx)) return;
        if (!sameVC(ctx)) return;
        if (!this.client.config.is247Allowed) return ctx.reply({ embeds: [createEmbed("error", i18n.__("commands.music.stayInQueue.247Disabled"), true)] });

        const newState = ctx.options?.getString("state") ?? ctx.args[0] as string | undefined;

        if (!newState) return ctx.reply({ embeds: [createEmbed("info", i18n.__mf("commands.music.stayInQueue.actualState", { state: `\`${ctx.guild?.queue?.stayInVC ? "ENABLED" : "DISABLED"}\`` }))] });

        ctx.guild!.queue!.stayInVC = (newState === "enable");

        return ctx.reply({ embeds: [createEmbed("success", i18n.__mf("commands.music.stayInQueue.newState", { state: `\`${ctx.guild?.queue?.stayInVC ? "ENABLED" : "DISABLED"}\`` }), true)] });
    }
}
