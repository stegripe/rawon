import { ApplicationCommandOptionType } from "discord.js";
import i18n from "../../config/index.js";
import { BaseCommand } from "../../structures/BaseCommand.js";
import { CommandContext } from "../../structures/CommandContext.js";
import { Command } from "../../utils/decorators/Command.js";
import { botReqPerms, memberReqPerms } from "../../utils/decorators/CommonUtil.js";
import { createEmbed } from "../../utils/functions/createEmbed.js";

@Command({
    contextUser: "Kick Member",
    description: i18n.__("commands.moderation.kick.description"),
    name: "kick",
    slash: {
        options: [
            {
                description: i18n.__("commands.moderation.kick.slashMemberDescription"),
                name: "member",
                required: true,
                type: ApplicationCommandOptionType.User
            },
            {
                description: i18n.__("commands.moderation.kick.slashReasonDescription"),
                name: "reason",
                required: false,
                type: ApplicationCommandOptionType.String
            }
        ]
    },
    usage: i18n.__("commands.moderation.kick.usage")
})
export class KickCommand extends BaseCommand {
    @memberReqPerms(["KickMembers"], i18n.__("commands.moderation.kick.userNoPermission"))
    @botReqPerms(["KickMembers"], i18n.__("commands.moderation.kick.botNoPermission"))
    public async execute(ctx: CommandContext): Promise<void> {
        if (!ctx.guild) return;

        const memberId =
            ctx.args.shift()?.replace(/\D/gu, "") ??
            ctx.options?.getUser("user")?.id ??
            ctx.options?.getUser("member")?.id;
        const member = ctx.guild.members.resolve(memberId ?? "");

        if (!member) {
            await ctx.reply({
                embeds: [createEmbed("warn", i18n.__("commands.moderation.common.noUserSpecified"))]
            });
            return;
        }
        if (!member.kickable) {
            await ctx.reply({
                embeds: [createEmbed("warn", i18n.__("commands.moderation.kick.userNoKickable"), true)]
            });
            return;
        }

        const reason =
            ctx.options?.getString("reason") ??
            (ctx.args.join(" ") || i18n.__("commands.moderation.common.noReasonString"));
        const dm = await member.user.createDM().catch(() => void 0);
        if (dm) {
            await dm.send({
                embeds: [
                    createEmbed(
                        "error",
                        i18n.__mf("commands.moderation.kick.userKicked", { guildName: ctx.guild.name })
                    )
                        .setThumbnail(ctx.guild.iconURL({ extension: "png", size: 1_024 }))
                        .addFields([
                            {
                                name: i18n.__("commands.moderation.common.reasonString"),
                                value: reason
                            }
                        ])
                        .setFooter({
                            text: i18n.__mf("commands.moderation.kick.kickedByString", {
                                author: ctx.author.tag
                            }),
                            iconURL: ctx.author.displayAvatarURL({})
                        })
                        .setTimestamp(Date.now())
                ]
            });
        }

        const kick = await member.kick(reason).catch((error: unknown) => new Error(error as string | undefined));
        if (kick instanceof Error) {
            await ctx.reply({
                embeds: [
                    createEmbed(
                        "error",
                        i18n.__mf("commands.moderation.kick.kickFail", { message: kick.message }),
                        true
                    )
                ]
            });
            return;
        }


        await ctx.reply({
            embeds: [
                createEmbed(
                    "success",
                    i18n.__mf("commands.moderation.kick.kickSuccess", { user: member.user.tag }),
                    true
                )
            ]
        });
    }
}
