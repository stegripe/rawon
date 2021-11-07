import { CommandContext } from "../../structures/CommandContext";
import { BaseCommand } from "../../structures/BaseCommand";
import { createEmbed } from "../../utils/createEmbed";
import i18n from "../../config";
import { Message } from "discord.js";

export class WarnCommand extends BaseCommand {
    public constructor(client: BaseCommand["client"]) {
        super(client, {
            description: i18n.__("commands.moderation.warn.description"),
            name: "warn",
            slash: {
                options: [
                    {
                        description: i18n.__("commands.moderation.warn.slashMemberDescription"),
                        name: "member",
                        required: true,
                        type: "USER"
                    },
                    {
                        description: i18n.__("commands.moderation.warn.slashReasonDescription"),
                        name: "reason",
                        required: false,
                        type: "STRING"
                    }
                ]
            },
            usage: i18n.__("commands.moderation.warn.usage")
        });
    }

    public async execute(ctx: CommandContext): Promise<Message> {
        if (!ctx.member?.permissions.has("MANAGE_GUILD")) return ctx.reply({ embeds: [createEmbed("error", i18n.__("commands.moderation.warn.userNoPermission"), true)] });

        const member = ctx.guild?.members.resolve(ctx.args.shift()?.replace(/[^0-9]/g, "") as string)?.user ?? ctx.options?.getUser("member", true);
        if (!member) return ctx.reply({ embeds: [createEmbed("warn", i18n.__("commands.moderation.common.noUserSpecified"))] });

        const dm = await member.createDM().catch(() => undefined);
        if (!dm) await ctx.reply({ embeds: [createEmbed("warn", i18n.__("commands.moderation.warn.noDM"))] });

        const reason = ctx.options?.getString("reason") ?? (ctx.args.join(" ") || i18n.__("commands.moderation.common.noReasonString"));
        const embed = createEmbed("warn", i18n.__mf("commands.moderation.warn.userWarned", { guildName: ctx.guild!.name }))
            .addField(i18n.__("commands.moderation.common.reasonString"), reason)
            .setFooter(i18n.__("commands.moderation.warn.warnedByString"), ctx.author.displayAvatarURL({ dynamic: true }))
            .setTimestamp(Date.now());

        await dm?.send({ embeds: [embed] });
        return ctx.reply({ embeds: [createEmbed("success", i18n.__mf("commands.moderation.warn.warnSuccess", { user: member.tag }), true)] });
    }
}
