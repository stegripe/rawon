import { botReqPerms, memberReqPerms } from "#rawon/utils/decorators/CommonUtil.js";
import { CommandContext } from "#rawon/structures/CommandContext.js";
import { createEmbed } from "#rawon/utils/functions/createEmbed.js";
import { BaseCommand } from "#rawon/structures/BaseCommand.js";
import { Command } from "#rawon/utils/decorators/Command.js";
import i18n from "#rawon/utils/functions/i18n.js";

import { ApplicationCommandOptionType, TextChannel } from "discord.js";

@Command({
    description: i18n.__("commands.moderation.purge.description"),
    name: "purge",
    slash: {
        options: [
            {
                description: "Number of messages to delete",
                name: "amount",
                required: true,
                type: ApplicationCommandOptionType.Integer
            }
        ]
    },
    usage: i18n.__("commands.moderation.purge.usage")
})
export class PurgeCommand extends BaseCommand {
    @botReqPerms(["ManageMessages"], i18n.__("commands.moderation.purge.botNoPermission"))
    @memberReqPerms(["ManageMessages"], i18n.__("commands.moderation.purge.userNoPermission"))
    public async execute(ctx: CommandContext): Promise<void> {
        const amount = ctx.options?.getNumber("amount") ?? parseInt(ctx.args.shift() ?? "a");
        if (isNaN(amount)) {
            void ctx.reply({
                embeds: [createEmbed("warn", i18n.__("commands.moderation.purge.invalidAmount"))]
            });
            return;
        }

        if (!ctx.isInteraction()) await ctx.delete();

        const purge = await (ctx.channel! as TextChannel).bulkDelete(amount, true).catch(r => new Error(r as string));
        if (purge instanceof Error) {
            void ctx.channel!.send({
                embeds: [createEmbed("warn", i18n.__mf("commands.moderation.purge.purgeFail", { message: purge.message }), true)]
            });

            return;
        }

        await ctx.channel!.send({
            embeds: [
                createEmbed(
                    "success",
                    i18n.__mf("commands.moderation.purge.purgeSuccess", { amount: purge.size }),
                    "🧹"
                )
            ]
        }).then(x => setTimeout(() => x.delete().catch(() => null), 3500));
    }
}
