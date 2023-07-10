import { botReqPerms, memberReqPerms } from "../../utils/decorators/CommonUtil.js";
import { CommandContext } from "../../structures/CommandContext.js";
import { createEmbed } from "../../utils/functions/createEmbed.js";
import { BaseCommand } from "../../structures/BaseCommand.js";
import { Command } from "../../utils/decorators/Command.js";
import i18n from "../../config/index.js";
import { ApplicationCommandOptionType, Message } from "discord.js";

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
                type: ApplicationCommandOptionType.String
            },
            {
                description: i18n.__("commands.moderation.ban.slashReasonDescription"),
                name: "reason",
                required: false,
                type: ApplicationCommandOptionType.String
            }
        ]
    },
    usage: i18n.__("commands.moderation.ban.usage")
})
export class BanCommand extends BaseCommand {
    @memberReqPerms(["BanMembers"], i18n.__("commands.moderation.ban.userNoPermission"))
    @botReqPerms(["BanMembers"], i18n.__("commands.moderation.ban.botNoPermission"))
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
                            .setThumbnail(ctx.guild.iconURL({ extension: "png", size: 1024 }))
                            .addFields([
                                {
                                    name: i18n.__("commands.moderation.common.reasonString"),
                                    value: reason
                                }
                            ])
                            .setFooter({
                                text: i18n.__mf("commands.moderation.ban.bannedByString", {
                                    author: ctx.author.tag
                                }),
                                iconURL: ctx.author.displayAvatarURL({})
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
