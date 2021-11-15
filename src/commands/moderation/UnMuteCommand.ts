import { CommandContext } from "../../structures/CommandContext";
import { BaseCommand } from "../../structures/BaseCommand";
import { createEmbed } from "../../utils/createEmbed";
import i18n from "../../config";
import { Message } from "discord.js";

export class UnMuteCommand extends BaseCommand {
    public constructor(client: BaseCommand["client"]) {
        super(client, {
            contextUser: "Un-mute Member",
            description: i18n.__("commands.moderation.unmute.description"),
            name: "unmute",
            slash: {
                options: [
                    {
                        description: i18n.__("commands.moderation.unmute.slashMemberDescription"),
                        name: "member",
                        required: true,
                        type: "USER"
                    },
                    {
                        description: i18n.__("commands.moderation.unmute.slashReasonDescription"),
                        name: "reason",
                        required: false,
                        type: "STRING"
                    }
                ]
            },
            usage: i18n.__("commands.moderation.unmute.usage")
        });
    }

    public async execute(ctx: CommandContext): Promise<Message> {
        if (!ctx.member?.permissions.has("MANAGE_ROLES")) return ctx.reply({ embeds: [createEmbed("error", i18n.__("commands.moderation.mute.userNoPermission"), true)] });
        if (!ctx.guild?.me?.permissions.has("MANAGE_ROLES")) return ctx.reply({ embeds: [createEmbed("error", i18n.__("commands.moderation.mute.botNoPermission"), true)] });

        const memberId = ctx.args.shift()?.replace(/[^0-9]/g, "") ?? ctx.options?.getUser("user")?.id ?? ctx.options?.getUser("member")?.id;
        const member = ctx.guild.members.resolve(memberId!);

        if (!member) return ctx.reply({ embeds: [createEmbed("warn", i18n.__("commands.moderation.common.noUserSpecified"))] });

        const muteRole = await this.client.utils.fetchMuteRole(ctx.guild).catch(() => null);
        if (!muteRole) return ctx.reply({ embeds: [createEmbed("warn", i18n.__("commands.moderation.unmute.unableToCreateMuteRole"))] });
        if (!member.roles.cache.has(muteRole.id)) return ctx.reply({ embeds: [createEmbed("warn", i18n.__("commands.moderation.unmute.noMuted"))] });

        const reason = ctx.options?.getString("reason") ?? (ctx.args.join(" ") || i18n.__("commands.moderation.common.noReasonString"));
        const dm = await member.user.createDM().catch(() => undefined);
        if (dm) {
            await dm.send({
                embeds: [
                    createEmbed("info", i18n.__mf("commands.moderation.unmute.userUnmuted", { guildName: ctx.guild.name }))
                        .addField(i18n.__("commands.moderation.common.reasonString"), reason)
                        .setFooter(i18n.__mf("commands.moderation.unmute.unmutedByString", { author: ctx.author.tag }), ctx.author.displayAvatarURL({ dynamic: true }))
                        .setTimestamp(Date.now())
                ]
            });
        }

        const unmute = await member.roles.remove(muteRole, reason).catch(err => new Error(err as string|undefined));
        if (unmute instanceof Error) return ctx.reply({ embeds: [createEmbed("error", i18n.__mf("commands.moderation.unmute.unmuteFail", { message: unmute.message }), true)] });

        return ctx.reply({ embeds: [createEmbed("success", i18n.__mf("commands.moderation.unmute.unmuteSuccess", { user: member.user.tag }), true)] });
    }
}
