import { botReqPerms, memberReqPerms } from "../../utils/decorators/CommonUtil";
import { CommandContext } from "../../structures/CommandContext";
import { createEmbed } from "../../utils/functions/createEmbed";
import { BaseCommand } from "../../structures/BaseCommand";
import { Command } from "../../utils/decorators/Command";
import i18n from "../../config";
import { Message } from "discord.js";

@Command({
    contextUser: "Ban Member",
    description: i18n.__("commands.moderation.ban.description"),
    name: "ban",
    slash: {
        options: [
            {
                description: i18n.__("commands.moderation.ban.slashMemberIDDescription"),
                name: "memberid",
                required: true,
                type: "STRING"
            },
            {
                description: i18n.__("commands.moderation.ban.slashReasonDescription"),
                name: "reason",
                required: false,
                type: "STRING"
            }
        ]
    },
    usage: i18n.__("commands.moderation.ban.usage")
})
export class BanCommand extends BaseCommand {
    @memberReqPerms(["BAN_MEMBERS"], i18n.__("commands.moderation.ban.userNoPermission"))
    @botReqPerms(["BAN_MEMBERS"], i18n.__("commands.moderation.ban.botNoPermission"))
    public async execute(ctx: CommandContext): Promise<Message | undefined> {
        if (!ctx.guild) return;

        const memberId =
            ctx.args.shift()?.replace(/[^0-9]/g, "") ??
            ctx.options?.getUser("user")?.id ??
            ctx.options?.getString("memberid");
        const user = await this.client.users.fetch(memberId!, { force: false }).catch(() => undefined);
        const resolved = ctx.guild.members.resolve(user!);

        if (!user) {
            return ctx.reply({
                embeds: [createEmbed("warn", i18n.__("commands.moderation.common.noUserSpecified"))]
            });
        }
        if (!resolved?.bannable) {
            return ctx.reply({
                embeds: [createEmbed("warn", i18n.__("commands.moderation.ban.userNoBannable"), true)]
            });
        }

        const reason =
            ctx.options?.getString("reason") ??
            (ctx.args.join(" ") || i18n.__("commands.moderation.common.noReasonString"));

        if (ctx.guild.members.cache.has(user.id)) {
            const dm = await user.createDM().catch(() => undefined);
            if (dm) {
                await dm.send({
                    embeds: [
                        createEmbed(
                            "error",
                            i18n.__mf("commands.moderation.ban.userBanned", {
                                guildName: ctx.guild.name
                            })
                        )
                            .setThumbnail(ctx.guild.iconURL({ dynamic: true, format: "png", size: 1024 })!)
                            .addField(i18n.__("commands.moderation.common.reasonString"), reason)
                            .setFooter({
                                text: i18n.__mf("commands.moderation.ban.bannedByString", {
                                    author: ctx.author.tag
                                }),
                                iconURL: ctx.author.displayAvatarURL({ dynamic: true })
                            })
                            .setTimestamp(Date.now())
                    ]
                });
            }
        }

        const ban = await ctx.guild.members
            .ban(user, {
                reason
            })
            .catch(err => new Error(err as string | undefined));
        if (ban instanceof Error) {
            return ctx.reply({
                embeds: [
                    createEmbed("error", i18n.__mf("commands.moderation.ban.banFail", { message: ban.message }), true)
                ]
            });
        }

        return ctx.reply({
            embeds: [createEmbed("success", i18n.__mf("commands.moderation.ban.banSuccess", { user: user.tag }), true)]
        });
    }
}
