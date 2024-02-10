import { botReqPerms, memberReqPerms } from "#rawon/utils/decorators/CommonUtil.js";
import { CommandContext } from "#rawon/structures/CommandContext.js";
import { createEmbed } from "#rawon/utils/functions/createEmbed.js";
import { BaseCommand } from "#rawon/structures/BaseCommand.js";
import { Command } from "#rawon/utils/decorators/Command.js";
import i18n from "#rawon/utils/functions/i18n.js";

import { ApplicationCommandOptionType } from "discord.js";

@Command({
    description: i18n.__("commands.moderation.unban.description"),
    name: "unban",
    slash: {
        options: [
            {
                description: i18n.__("commands.moderation.unban.slashMemberDescription"),
                name: "memberid",
                required: true,
                type: ApplicationCommandOptionType.String
            },
            {
                description: i18n.__("commands.moderation.unban.slashReasonDescription"),
                name: "reason",
                required: false,
                type: ApplicationCommandOptionType.String
            }
        ]
    },
    usage: i18n.__("commands.moderation.unban.usage")
})
export class UnBanCommand extends BaseCommand {
    @botReqPerms(["BanMembers"], i18n.__("commands.moderation.ban.botNoPermission"))
    @memberReqPerms(["BanMembers"], i18n.__("commands.moderation.ban.userNoPermission"))
    public async execute(ctx: CommandContext): Promise<void> {
        if (!ctx.guild) return;

        const memberId =
            ctx.args.shift()?.replace(/[^0-9]/g, "") ??
            ctx.options?.getUser("user")?.id ??
            ctx.options?.getString("memberid");
        const resolved = await ctx.guild.bans.fetch(memberId!).catch(() => null);

        if (!resolved) {
            void ctx.reply({
                embeds: [createEmbed("error", i18n.__("commands.moderation.unban.alreadyUnban"), true)]
            });

            return;
        }

        const unban = await ctx.guild.bans.remove(
            memberId!,
            ctx.options?.getString("reason") ?? (
                ctx.args.join(" ") || i18n.__("commands.moderation.common.noReasonString")
            )
        ).catch((err: string) => new Error(err));

        if (unban instanceof Error) {
            void ctx.reply({
                embeds: [createEmbed("error", i18n.__mf("commands.moderation.unban.unbanFail", { message: unban.message }), true)]
            });

            return;
        }

        void ctx.reply({
            embeds: [createEmbed("success", i18n.__mf("commands.moderation.unban.unbanSuccess", { user: resolved.user.tag }), true)]
        });
    }
}
