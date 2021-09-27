import { DefineCommand } from "../../utils/decorators/DefineCommand";
import { CommandContext } from "../../structures/CommandContext";
import { BaseCommand } from "../../structures/BaseCommand";
import { createEmbed } from "../../utils/createEmbed";

@DefineCommand({
    contextUser: "Kick Member",
    description: "Kick someone from the server",
    name: "kick",
    slash: {
        options: [
            {
                description: "Who do you like to kick?",
                name: "member",
                required: true,
                type: "USER"
            },
            {
                description: "Kick reason",
                name: "reason",
                required: false,
                type: "STRING"
            }
        ]
    },
    usage: "{prefix}kick <@mention | id> [reason]"
})
export class KickCommand extends BaseCommand {
    public async execute(ctx: CommandContext): Promise<any> {
        if (!ctx.member?.permissions.has("KICK_MEMBERS")) return ctx.reply({ embeds: [createEmbed("error", "Sorry, but you don't have **`KICK MEMBERS`** permission to use this command.", true)] });
        if (!ctx.guild?.me?.permissions.has("KICK_MEMBERS")) return ctx.reply({ embeds: [createEmbed("error", "Sorry, but I don't have **`KICK MEMBERS`** permission.", true)] });

        const memberId = ctx.args.shift()?.replace(/[^0-9]/g, "") ?? ctx.options?.getUser("user")?.id ?? ctx.options?.getUser("member")?.id;
        const member = ctx.guild.members.resolve(memberId!);

        if (!member) return ctx.reply({ embeds: [createEmbed("warn", "Please specify someone.")] });
        if (!member.kickable) return ctx.reply({ embeds: [createEmbed("error", "Sorry, but I can't **\`KICK\`** that member.", true)] });

        const reason = ctx.options?.getString("reason") ?? (ctx.args.join(" ") || "[Not Specified]");
        const dm = await member.user.createDM().catch(() => undefined);
        if (dm) {
            await dm.send({
                embeds: [
                    createEmbed("error", `You have been **\`KICKED\`** from **${ctx.guild.name}**`)
                        .addField("**Reason**", reason)
                        .setFooter(`Kicked by: ${ctx.author.tag}`, ctx.author.displayAvatarURL({ dynamic: true }))
                        .setTimestamp(Date.now())
                ]
            });
        }

        const kick = await member.kick(reason).catch(err => new Error(err));
        if (kick instanceof Error) return ctx.reply({ embeds: [createEmbed("error", `Unable to **\`KICK**\` member, because: \`${kick.message}\``)] });

        return ctx.reply({ embeds: [createEmbed("success", `**${member.user.tag}** has been **\`KICKED\`** from the server.`, true)] });
    }
}
