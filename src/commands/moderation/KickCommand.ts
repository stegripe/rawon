import { CommandContext } from "../../structures/CommandContext";
import { BaseCommand } from "../../structures/BaseCommand";
import { createEmbed } from "../../utils/createEmbed";
import i18n from "../../config";
import { Message } from "discord.js";

export class KickCommand extends BaseCommand {
    public constructor(client: BaseCommand["client"]) {
        super(client, {
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
        });
    }

    public async execute(ctx: CommandContext): Promise<Message> {
        if (!ctx.member?.permissions.has("KICK_MEMBERS")) return ctx.reply({ embeds: [createEmbed("error", i18n.__("commands.moderation.kick.userNoPermission"), true)] });
        if (!ctx.guild?.me?.permissions.has("KICK_MEMBERS")) return ctx.reply({ embeds: [createEmbed("error", i18n.__("commands.moderation.kick.botNoPermission"), true)] });

        const memberId = ctx.args.shift()?.replace(/[^0-9]/g, "") ?? ctx.options?.getUser("user")?.id ?? ctx.options?.getUser("member")?.id;
        const member = ctx.guild.members.resolve(memberId!);

        if (!member) return ctx.reply({ embeds: [createEmbed("warn", i18n.__("commands.moderation.common.noUserSpecified"))] });
        if (!member.kickable) return ctx.reply({ embeds: [createEmbed("warn", i18n.__("commands.moderation.kick.userNoKickable"), true)] });

        const reason = ctx.options?.getString("reason") ?? (ctx.args.join(" ") || i18n.__("commands.moderation.common.noReasonString"));
        const dm = await member.user.createDM().catch(() => undefined);
        if (dm) {
            await dm.send({
                embeds: [
                    createEmbed("error", i18n.__mf("commands.moderation.kick.userKicked", { guildName: ctx.guild.name }))
                        .addField(i18n.__("commands.moderation.common.reasonString"), reason)
                        .setFooter(i18n.__mf("commands.moderation.kick.kickedByString", { author: ctx.author.tag }), ctx.author.displayAvatarURL({ dynamic: true }))
                        .setTimestamp(Date.now())
                ]
            });
        }

        const kick = await member.kick(reason).catch(err => new Error(err as string|undefined));
        if (kick instanceof Error) return ctx.reply({ embeds: [createEmbed("error", i18n.__mf("commands.moderation.kick.kickFail", { message: kick.message }), true)] });

        return ctx.reply({ embeds: [createEmbed("success", i18n.__mf("commands.moderation.kick.kickSuccess", { user: member.user.tag }), true)] });
    }
}
