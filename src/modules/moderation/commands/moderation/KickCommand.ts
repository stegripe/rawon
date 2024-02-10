import { botReqPerms, memberReqPerms } from "#rawon/utils/decorators/CommonUtil.js";
import { CommandContext } from "#rawon/structures/CommandContext.js";
import { createEmbed } from "#rawon/utils/functions/createEmbed.js";
import { BaseCommand } from "#rawon/structures/BaseCommand.js";
import { Command } from "#rawon/utils/decorators/Command.js";
import i18n from "#rawon/utils/functions/i18n.js";
import { ApplicationCommandOptionType } from "discord.js";

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
    @botReqPerms(["KickMembers"], i18n.__("commands.moderation.kick.botNoPermission"))
    @memberReqPerms(["KickMembers"], i18n.__("commands.moderation.kick.userNoPermission"))
    public async execute(ctx: CommandContext): Promise<void> {
        if (!ctx.guild) return;

        const memberId =
            ctx.args.shift()?.replace(/[^0-9]/g, "") ??
            ctx.options?.getUser("user")?.id ??
            ctx.options?.getUser("member")?.id;
        const member = ctx.guild.members.resolve(memberId!);

        if (!member) {
            void ctx.reply({
                embeds: [createEmbed("warn", i18n.__("commands.moderation.common.noUserSpecified"))]
            });
            return;
        }

        if (!member.kickable) {
            void ctx.reply({
                embeds: [createEmbed("warn", i18n.__("commands.moderation.kick.userNoKickable"), true)]
            });

            return;
        }

        const reason = ctx.options?.getString("reason") ?? (ctx.args.join(" ") || i18n.__("commands.moderation.common.noReasonString"));
        const dm = await member.user.createDM().catch(() => null);
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
                            text: i18n.__mf("commands.moderation.kick.kickedByString", { author: ctx.author.tag }),
                            iconURL: ctx.author.displayAvatarURL()
                        })
                ]
            }).catch(() => null);
        }

        const kick = await member.kick(reason).catch(err => new Error(err as string | undefined));
        if (kick instanceof Error) {
            void ctx.reply({
                embeds: [createEmbed("error", i18n.__mf("commands.moderation.kick.kickFail", { message: kick.message }), true)]
            });

            return;
        }

        void ctx.reply({
            embeds: [createEmbed("success", i18n.__mf("commands.moderation.kick.kickSuccess", { user: member.user.tag }), true)]
        });
    }
}
