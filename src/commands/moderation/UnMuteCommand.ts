import { botReqPerms, memberReqPerms } from "../../utils/decorators/CommonUtil.js";
import { CommandContext } from "../../structures/CommandContext.js";
import { createEmbed } from "../../utils/functions/createEmbed.js";
import { BaseCommand } from "../../structures/BaseCommand.js";
import { Command } from "../../utils/decorators/Command.js";
import i18n from "../../config/index.js";
import { ApplicationCommandOptionType, Message } from "discord.js";

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

        const muteRole = await this.client.utils.fetchMuteRole(ctx.guild);
        if (!muteRole) {
            return ctx.reply({
                embeds: [
                    createEmbed(
                        "warn",
                        i18n.__mf("commands.moderation.mute.noRole", {
                            prefix: this.client.config.mainPrefix
                        })
                    )
                ]
            });
        }
        if (!member.roles.cache.has(muteRole.id)) {
            return ctx.reply({
                embeds: [createEmbed("error", i18n.__("commands.moderation.unmute.noMuted"), true)]
            });
        }

        const reason =
            ctx.options?.getString("reason") ??
            (ctx.args.join(" ") || i18n.__("commands.moderation.common.noReasonString"));
        const unmute = await member.roles.remove(muteRole, reason).catch(err => new Error(err as string | undefined));
        if (unmute instanceof Error) {
            return ctx.reply({
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
        }

        const dm = await member.user.createDM().catch(() => undefined);
        if (dm) {
            await dm.send({
                embeds: [
                    createEmbed(
                        "info",
                        i18n.__mf("commands.moderation.unmute.userUnmuted", {
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
                            text: i18n.__mf("commands.moderation.unmute.unmutedByString", { author: ctx.author.tag }),
                            iconURL: ctx.author.displayAvatarURL({})
                        })
                        .setTimestamp(Date.now())
                ]
            });
        }

        return ctx.reply({
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
