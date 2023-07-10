import { botReqPerms, memberReqPerms } from "../../utils/decorators/CommonUtil.js";
import { CommandContext } from "../../structures/CommandContext.js";
import { createEmbed } from "../../utils/functions/createEmbed.js";
import { BaseCommand } from "../../structures/BaseCommand.js";
import { Command } from "../../utils/decorators/Command.js";
import i18n from "../../config/index.js";
import { ApplicationCommandOptionType, Message } from "discord.js";

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
    public async execute(ctx: CommandContext): Promise<Message | undefined> {
        if (!ctx.guild) return;

        const memberId =
            ctx.args.shift()?.replace(/[^0-9]/g, "") ??
            ctx.options?.getUser("user")?.id ??
            ctx.options?.getString("memberid");
        const user = await this.client.users.fetch(memberId!, { force: false }).catch(() => undefined);
        const resolved = ctx.guild.bans.resolve(user?.id ?? "");

        if (!user) {
            return ctx.reply({
                embeds: [createEmbed("warn", i18n.__("commands.moderation.common.noUserSpecified"))]
            });
        }
        if (!resolved) {
            return ctx.reply({
                embeds: [createEmbed("error", i18n.__("commands.moderation.unban.alreadyUnban"), true)]
            });
        }

        const unban = await ctx.guild.bans
            .remove(
                user.id,
                ctx.options?.getString("reason") ??
                (ctx.args.length ? ctx.args.join(" ") : i18n.__("commands.moderation.common.noReasonString"))
            )
            .catch(err => new Error(err as string | undefined));
        if (unban instanceof Error) {
            return ctx.reply({
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
        }

        return ctx.reply({
            embeds: [
                createEmbed("success", i18n.__mf("commands.moderation.unban.unbanSuccess", { user: user.tag }), true)
            ]
        });
    }
}
