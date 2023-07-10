import { botReqPerms, memberReqPerms } from "../../utils/decorators/CommonUtil.js";
import { CommandContext } from "../../structures/CommandContext.js";
import { createEmbed } from "../../utils/functions/createEmbed.js";
import { BaseCommand } from "../../structures/BaseCommand.js";
import { Command } from "../../utils/decorators/Command.js";
import i18n from "../../config/index.js";
import { ApplicationCommandOptionType, Message } from "discord.js";

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
    public async execute(ctx: CommandContext): Promise<Message | undefined> {
        if (!ctx.guild) return;

        const memberId =
            ctx.args.shift()?.replace(/[^0-9]/g, "") ??
            ctx.options?.getUser("user")?.id ??
            ctx.options?.getUser("member")?.id;
        const member = ctx.guild.members.resolve(memberId!);

        if (!member) {
            return ctx.reply({
                embeds: [createEmbed("warn", i18n.__("commands.moderation.common.noUserSpecified"))]
            });
        }
        if (!member.kickable) {
            return ctx.reply({
                embeds: [createEmbed("warn", i18n.__("commands.moderation.kick.userNoKickable"), true)]
            });
        }

        const reason =
            ctx.options?.getString("reason") ??
            (ctx.args.join(" ") || i18n.__("commands.moderation.common.noReasonString"));
        const dm = await member.user.createDM().catch(() => undefined);
        if (dm) {
            await dm.send({
                embeds: [
                    createEmbed(
                        "error",
                        i18n.__mf("commands.moderation.kick.userKicked", { guildName: ctx.guild.name })
                    )
                        .setThumbnail(ctx.guild.iconURL({ extension: "png", size: 1024 }))
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

        const kick = await member.kick(reason).catch(err => new Error(err as string | undefined));
        if (kick instanceof Error)
            return ctx.reply({
                embeds: [
                    createEmbed(
                        "error",
                        i18n.__mf("commands.moderation.kick.kickFail", { message: kick.message }),
                        true
                    )
                ]
            });

        return ctx.reply({
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
