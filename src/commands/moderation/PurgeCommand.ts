import { botReqPerms, memberReqPerms } from "../../utils/decorators/CommonUtil";
import { CommandContext } from "../../structures/CommandContext";
import { createEmbed } from "../../utils/functions/createEmbed";
import { BaseCommand } from "../../structures/BaseCommand";
import { Command } from "../../utils/decorators/Command";
import i18n from "../../config";
import { TextChannel, Message } from "discord.js";

@Command({
    description: i18n.__("commands.moderation.purge.description"),
    name: "purge",
    slash: {
        options: [
            {
                description: i18n.__("commands.moderation.purge.slashAmountDescription"),
                name: "amount",
                required: true,
                type: "NUMBER"
            }
        ]
    },
    usage: i18n.__("commands.moderation.purge.usage")
})
export class PurgeCommand extends BaseCommand {
    @memberReqPerms(["MANAGE_MESSAGES"], i18n.__("commands.moderation.purge.userNoPermission"))
    @botReqPerms(["MANAGE_MESSAGES"], i18n.__("commands.moderation.purge.botNoPermission"))
    public async execute(ctx: CommandContext): Promise<Message | undefined> {
        const amount = Number(ctx.options?.getString("amount") ?? ctx.args.shift());
        if (isNaN(amount)) {
            return ctx.reply({
                embeds: [createEmbed("warn", i18n.__("commands.moderation.purge.invalidAmount"))]
            });
        }

        await (ctx.context as Message).delete();
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
