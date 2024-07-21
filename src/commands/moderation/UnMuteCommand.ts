import { ApplicationCommandOptionType } from "discord.js";
import i18n from "../../config/index.js";
import { BaseCommand } from "../../structures/BaseCommand.js";
import { CommandContext } from "../../structures/CommandContext.js";
import { Command } from "../../utils/decorators/Command.js";
import { botReqPerms, memberReqPerms } from "../../utils/decorators/CommonUtil.js";
import { createEmbed } from "../../utils/functions/createEmbed.js";

@Command({
    contextUser: "Un-mute Member",
    description: i18n.__("commands.moderation.unmute.description"),
    name: "unmute",
    slash: {
        options: [
            {
                description: i18n.__("commands.moderation.unmute.slashMemberDescription"),
                name: "member",
                required: true,
                type: ApplicationCommandOptionType.User
            },
            {
                description: i18n.__("commands.moderation.unmute.slashReasonDescription"),
                name: "reason",
                required: false,
                type: ApplicationCommandOptionType.String
            }
        ]
    },
    usage: i18n.__("commands.moderation.unmute.usage")
})
export class UnMuteCommand extends BaseCommand {
    @memberReqPerms(["ManageRoles"], i18n.__("commands.moderation.mute.userNoPermission"))
    @botReqPerms(["ManageRoles"], i18n.__("commands.moderation.mute.botNoPermission"))
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

        const muteRole = await this.client.utils.fetchMuteRole(ctx.guild);
        if (!muteRole) {
            await ctx.reply({
                embeds: [
                    createEmbed(
                        "warn",
                        i18n.__mf("commands.moderation.mute.noRole", {
                            prefix: this.client.config.mainPrefix
                        })
                    )
                ]
            });
            return;
        }
        if (!member.roles.cache.has(muteRole.id)) {
            await ctx.reply({
                embeds: [createEmbed("error", i18n.__("commands.moderation.unmute.noMuted"), true)]
            });
            return;
        }

        const reason =
            ctx.options?.getString("reason") ??
            (ctx.args.join(" ") || i18n.__("commands.moderation.common.noReasonString"));
        const unmute = await member.roles.remove(muteRole, reason).catch((error: unknown) => new Error(error as string | undefined));
        if (unmute instanceof Error) {
            await ctx.reply({
                embeds: [
                    createEmbed(
                        "error",
                        i18n.__mf("commands.moderation.unmute.unmuteFail", {
                            message: unmute.message
                        }),
                        true
                    )
                ]
            });

            return;
        }

        const dm = await member.user.createDM().catch(() => void 0);
        if (dm) {
            await dm.send({
                embeds: [
                    createEmbed(
                        "info",
                        i18n.__mf("commands.moderation.unmute.userUnmuted", {
                            guildName: ctx.guild.name
                        })
                    )
                        .setThumbnail(ctx.guild.iconURL({ extension: "png", size: 1_024 }))
                        .addFields([
                            {
                                name: i18n.__("commands.moderation.common.reasonString"),
                                value: reason
                            }
                        ])
                        .setFooter({
                            text: i18n.__mf("commands.moderation.unmute.unmutedByString", { author: ctx.author.tag }),
                            iconURL: ctx.author.displayAvatarURL({})
                        })
                        .setTimestamp(Date.now())
                ]
            });
        }

        await ctx.reply({
            embeds: [
                createEmbed(
                    "success",
                    i18n.__mf("commands.moderation.unmute.unmuteSuccess", {
                        user: member.user.tag
                    }),
                    true
                )
            ]
        });
    }
}
