import { CommandContext } from "../../structures/CommandContext";
import { BaseCommand } from "../../structures/BaseCommand";
import { createEmbed } from "../../utils/createEmbed";
import i18n from "../../config";
import { TextChannel, Message } from "discord.js";

export class PurgeCommand extends BaseCommand {
    public constructor(client: BaseCommand["client"]) {
        super(client, {
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
        });
    }

    public async execute(ctx: CommandContext): Promise<Message|void> {
        if (!ctx.member?.permissions.has("MANAGE_MESSAGES")) return ctx.reply({ embeds: [createEmbed("error", i18n.__("commands.moderation.purge.userNoPermission"), true)] });
        if (!ctx.guild?.me?.permissions.has("MANAGE_MESSAGES")) return ctx.reply({ embeds: [createEmbed("error", i18n.__("commands.moderation.purge.botNoPermission"), true)] });

        const amount = Number(ctx.options?.getString("amount") ?? ctx.args.shift());
        if (isNaN(amount)) return ctx.reply({ embeds: [createEmbed("warn", i18n.__("commands.moderation.purge.invalidAmount"))] });

        const purge = await (ctx.channel as TextChannel).bulkDelete(amount + 1, true)
            .catch(err => new Error(err as string|undefined));
        if (purge instanceof Error) return ctx.reply({ embeds: [createEmbed("warn", i18n.__mf("commands.moderation.purge.purgeFail", { message: purge.message }), true)] });

        return ctx.reply({ embeds: [createEmbed("success", `🧹 **|** ${i18n.__mf("commands.moderation.purge.purgeSuccess", { amount: purge.size })}`)] });
    }
}
