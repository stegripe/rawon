import { DefineCommand } from "../../utils/decorators/DefineCommand";
import { CommandContext } from "../../structures/CommandContext";
import { BaseCommand } from "../../structures/BaseCommand";
import { createEmbed } from "../../utils/createEmbed";

@DefineCommand({
    contextUser: "Unmute Member",
    description: "Unmute someone on the server",
    name: "unmute",
    slash: {
        options: [
            {
                description: "Who do you like to unmute?",
                name: "member",
                required: true,
                type: "USER"
            },
            {
                description: "Unmute reason",
                name: "reason",
                required: false,
                type: "STRING"
            }
        ]
    }
})
export class UnMuteCommand extends BaseCommand {
    public async execute(ctx: CommandContext): Promise<any> {
        if (!ctx.member?.permissions.has("MANAGE_ROLES")) return ctx.reply({ embeds: [createEmbed("error", "Sorry, but you don't have **`MANAGE ROLES`** permission to use this command.", true)] });
        if (!ctx.guild?.me?.permissions.has("MANAGE_ROLES")) return ctx.reply({ embeds: [createEmbed("error", "Sorry, but I don't have **`MANAGE ROLES`** permission.", true)] });

        const memberId = ctx.args.shift()?.replace(/[^0-9]/g, "") ?? ctx.options?.getUser("user")?.id ?? ctx.options?.getUser("member")?.id;
        const member = ctx.guild.members.resolve(memberId!);

        if (!member) return ctx.reply({ embeds: [createEmbed("warn", "Please specify someone.")] });

        const muteRole = await this.client.utils.fetchMuteRole(ctx.guild);
        if (!member.roles.cache.has(muteRole.id)) return ctx.reply({ embeds: [createEmbed("warn", "That member is not **\`MUTED\`**")] });

        const reason = ctx.options?.getString("reason") ?? (ctx.args.join(" ") || "[Not Specified]");
        const dm = await member.user.createDM().catch(() => undefined);
        if (dm) {
            await dm.send({
                embeds: [
                    createEmbed("info", `You have been **\`UN-MUTED\`** on **${ctx.guild.name}**`)
                        .addField("**Reason**", reason)
                        .setFooter(`Un-muted by: ${ctx.author.tag}`, ctx.author.displayAvatarURL({ dynamic: true }))
                        .setTimestamp(Date.now())
                ]
            });
        }

        const unmute = await member.roles.remove(muteRole, reason).catch(err => new Error(err));
        if (unmute instanceof Error) return ctx.reply({ embeds: [createEmbed("error", `Unable to **\`UN-MUTE\`** member, because: \`${unmute.message}\``)] });

        return ctx.reply({ embeds: [createEmbed("success", `**${member.user.tag}** has been **\`UN-MUTED\`** on the server.`, true)] });
    }
}
