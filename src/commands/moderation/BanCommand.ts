import { DefineCommand } from "../../utils/decorators/DefineCommand";
import { CommandContext } from "../../structures/CommandContext";
import { BaseCommand } from "../../structures/BaseCommand";
import { createEmbed } from "../../utils/createEmbed";

@DefineCommand({
    contextUser: "Ban Member",
    description: "Ban someone from the server",
    name: "ban",
    slash: {
        options: [
            {
                description: "Who do you like to ban?",
                name: "memberid",
                required: true,
                type: "STRING"
            },
            {
                description: "Ban reason",
                name: "reason",
                required: false,
                type: "STRING"
            }
        ]
    },
    usage: "{prefix}ban <@mention | id> [reason]"
})
export class BanCommand extends BaseCommand {
    public async execute(ctx: CommandContext): Promise<any> {
        if (!ctx.member?.permissions.has("BAN_MEMBERS")) return ctx.reply({ embeds: [createEmbed("error", "Sorry, but you don't have **`BAN MEMBERS`** permission to use this command.", true)] });
        if (!ctx.guild?.me?.permissions.has("BAN_MEMBERS")) return ctx.reply({ embeds: [createEmbed("error", "Sorry, but I don't have **`BAN MEMBERS`** permission.", true)] });

        const memberId = ctx.args.shift()?.replace(/[^0-9]/g, "") ?? ctx.options?.getUser("user")?.id ?? ctx.options?.getString("memberid");
        const user = await this.client.users.fetch(memberId!, { force: false }).catch(() => undefined);
        const resolved = ctx.guild.members.resolve(user!);

        if (!user) return ctx.reply({ embeds: [createEmbed("warn", "Please specify someone.")] });
        if (!resolved?.bannable) return ctx.reply({ embeds: [createEmbed("error", "Sorry, but I can't **\`BAN\`** that member.", true)] });

        const reason = ctx.options?.getString("reason") ?? (ctx.args.join(" ") || "[Not Specified]");
        if (ctx.guild.members.cache.has(user.id)) {
            const dm = await user.createDM().catch(() => undefined);
            if (dm) {
                await dm.send({
                    embeds: [
                        createEmbed("error", `You have been **\`BANNED\`** from **${ctx.guild.name}**`)
                            .addField("**Reason**", reason)
                            .setFooter(`Banned by: ${ctx.author.tag}`, ctx.author.displayAvatarURL({ dynamic: true }))
                            .setTimestamp(Date.now())
                    ]
                });
            }
        }

        const ban = await ctx.guild.members.ban(user, {
            reason
        }).catch(err => new Error(err));
        if (ban instanceof Error) return ctx.reply({ embeds: [createEmbed("error", `Unable to **\`BAN\`** member, because: \`${ban.message}\``, true)] });

        return ctx.reply({ embeds: [createEmbed("success", `**${user.tag}** has been **\`BANNED\`** from the server.`, true)] });
    }
}
