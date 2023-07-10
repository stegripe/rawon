import { botReqPerms, memberReqPerms } from "../../utils/decorators/CommonUtil.js";
import { CommandContext } from "../../structures/CommandContext.js";
import { createEmbed } from "../../utils/functions/createEmbed.js";
import { BaseCommand } from "../../structures/BaseCommand.js";
import { Command } from "../../utils/decorators/Command.js";
import i18n from "../../config/index.js";
import { TextChannel, Message, ApplicationCommandOptionType } from "discord.js";

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
    public async execute(ctx: CommandContext): Promise<Message | undefined> {
        const amount = Number(ctx.options?.getNumber("amount") ?? ctx.args.shift());
        if (isNaN(amount)) {
            return ctx.reply({
                embeds: [createEmbed("warn", i18n.__("commands.moderation.purge.invalidAmount"))]
            });
        }

        if (!ctx.isInteraction()) {
            await (ctx.context as Message).delete();
        }

        const purge = await (ctx.channel as TextChannel)
            .bulkDelete(amount, true)
            .catch(err => new Error(err as string | undefined));
        if (purge instanceof Error) {
            return ctx.reply({
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
            .then(msg => setTimeout(() => msg.delete(), 3500));
    }
}
