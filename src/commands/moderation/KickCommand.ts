import { botReqPerms, memberReqPerms } from "../../utils/decorators/CommonUtil";
import { CommandContext } from "../../structures/CommandContext";
import { createEmbed } from "../../utils/functions/createEmbed";
import { BaseCommand } from "../../structures/BaseCommand";
import { Command } from "../../utils/decorators/Command";
import i18n from "../../config";
import { Message } from "discord.js";

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
                type: "USER"
            },
            {
                description: i18n.__("commands.moderation.kick.slashReasonDescription"),
                name: "reason",
                required: false,
                type: "STRING"
            }
        ]
    },
    usage: i18n.__("commands.moderation.kick.usage")
})
export class KickCommand extends BaseCommand {
    @memberReqPerms(["KICK_MEMBERS"], i18n.__("commands.moderation.kick.userNoPermission"))
    @botReqPerms(["KICK_MEMBERS"], i18n.__("commands.moderation.kick.botNoPermission"))
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
                        .setThumbnail(ctx.guild.iconURL({ dynamic: true, format: "png", size: 1024 })!)
                        .addField(i18n.__("commands.moderation.common.reasonString"), reason)
                        .setFooter({
                            text: i18n.__mf("commands.moderation.kick.kickedByString", {
                                author: ctx.author.tag
                            }),
                            iconURL: ctx.author.displayAvatarURL({ dynamic: true })
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
