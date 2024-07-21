import { setTimeout } from "node:timers";
import { ApplicationCommandOptionType, Message, TextChannel } from "discord.js";
import i18n from "../../config/index.js";
import { BaseCommand } from "../../structures/BaseCommand.js";
import { CommandContext } from "../../structures/CommandContext.js";
import { Command } from "../../utils/decorators/Command.js";
import { botReqPerms, memberReqPerms } from "../../utils/decorators/CommonUtil.js";
import { createEmbed } from "../../utils/functions/createEmbed.js";

@Command({
    description: i18n.__("commands.moderation.purge.description"),
    name: "purge",
    slash: {
        options: [
            {
                description: i18n.__("commands.moderation.purge.slashAmountDescription"),
                name: "amount",
                required: true,
                type: ApplicationCommandOptionType.Number
            }
        ]
    },
    usage: i18n.__("commands.moderation.purge.usage")
})
export class PurgeCommand extends BaseCommand {
    @memberReqPerms(["ManageMessages"], i18n.__("commands.moderation.purge.userNoPermission"))
    @botReqPerms(["ManageMessages"], i18n.__("commands.moderation.purge.botNoPermission"))
    public async execute(ctx: CommandContext): Promise<void> {
        const amount = Number(ctx.options?.getNumber("amount") ?? ctx.args.shift() ?? Number.NaN) ;
        if (Number.isNaN(amount)) {
            await ctx.reply({
                embeds: [createEmbed("warn", i18n.__("commands.moderation.purge.invalidAmount"))]
            });
            return;
        }

        if (!ctx.isInteraction()) {
            await (ctx.context as Message).delete();
        }

        const purge = await (ctx.channel as TextChannel)
            .bulkDelete(amount, true)
            .catch((error: unknown) => new Error(error as string | undefined));
        if (purge instanceof Error) {
            await ctx.reply({
                embeds: [
                    createEmbed(
                        "warn",
                        i18n.__mf("commands.moderation.purge.purgeFail", {
                            message: purge.message
                        }),
                        true
                    )
                ]
            });
            return;
        }

        await ctx
            .reply({
                embeds: [
                    createEmbed(
                        "success",
                        `🧹 **|** ${i18n.__mf("commands.moderation.purge.purgeSuccess", { amount: purge.size })}`
                    )
                ]
            })
            .then(msg => setTimeout(async () => msg.delete(), 3_500));
    }
}
