import { ApplicationCommandOptionType } from "discord.js";
import i18n from "../../config/index.js";
import { BaseCommand } from "../../structures/BaseCommand.js";
import { CommandContext } from "../../structures/CommandContext.js";
import { Command } from "../../utils/decorators/Command.js";
import { botReqPerms, memberReqPerms } from "../../utils/decorators/CommonUtil.js";
import { createEmbed } from "../../utils/functions/createEmbed.js";

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
    @memberReqPerms(["BanMembers"], i18n.__("commands.moderation.ban.userNoPermission"))
    @botReqPerms(["BanMembers"], i18n.__("commands.moderation.ban.botNoPermission"))
    public async execute(ctx: CommandContext): Promise<void> {
        if (!ctx.guild) return;

        const memberId =
            ctx.args.shift()?.replace(/\D/gu, "") ??
            ctx.options?.getUser("user")?.id ??
            ctx.options?.getString("memberid");
        const user = await this.client.users.fetch(memberId ?? "", { force: false }).catch(() => void 0);
        const resolved = ctx.guild.bans.resolve(user?.id ?? "");

        if (!user) {
            await ctx.reply({
                embeds: [createEmbed("warn", i18n.__("commands.moderation.common.noUserSpecified"))]
            });
            return;
        }
        if (!resolved) {
            await ctx.reply({
                embeds: [createEmbed("error", i18n.__("commands.moderation.unban.alreadyUnban"), true)]
            });
            return;
        }

        const unban = await ctx.guild.bans
            .remove(
                user.id,
                ctx.options?.getString("reason") ??
                (ctx.args.length > 0 ? ctx.args.join(" ") : i18n.__("commands.moderation.common.noReasonString"))
            )
            .catch((error: unknown) => new Error(error as string | undefined));
        if (unban instanceof Error) {
            await ctx.reply({
                embeds: [
                    createEmbed(
                        "error",
                        i18n.__mf("commands.moderation.unban.unbanFail", {
                            message: unban.message
                        }),
                        true
                    )
                ]
            });

            return;
        }

        await ctx.reply({
            embeds: [
                createEmbed("success", i18n.__mf("commands.moderation.unban.unbanSuccess", { user: user.tag }), true)
            ]
        });
    }
}
