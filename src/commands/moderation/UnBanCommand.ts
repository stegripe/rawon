import { botReqPerms, memberReqPerms } from "../../utils/decorators/CommonUtil";
import { CommandContext } from "../../structures/CommandContext";
import { createEmbed } from "../../utils/functions/createEmbed";
import { BaseCommand } from "../../structures/BaseCommand";
import { Command } from "../../utils/decorators/Command";
import i18n from "../../config";
import { Message } from "discord.js";

@Command({
    description: i18n.__("commands.moderation.unban.description"),
    name: "unban",
    slash: {
        options: [
            {
                description: i18n.__("commands.moderation.unban.slashMemberDescription"),
                name: "memberid",
                required: true,
                type: "STRING"
            },
            {
                description: i18n.__("commands.moderation.unban.slashReasonDescription"),
                name: "reason",
                required: false,
                type: "STRING"
            }
        ]
    },
    usage: i18n.__("commands.moderation.unban.usage")
})
export class UnBanCommand extends BaseCommand {
    @memberReqPerms(["BAN_MEMBERS"], i18n.__("commands.moderation.ban.userNoPermission"))
    @botReqPerms(["BAN_MEMBERS"], i18n.__("commands.moderation.ban.botNoPermission"))
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
                createEmbed("success", i18n.__mf("commands.moderation.unban.ubanSuccess", { user: user.tag }), true)
            ]
        });
    }
}
