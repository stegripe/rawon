import { DefineCommand } from "../../utils/decorators/DefineCommand";
import { CommandContext } from "../../structures/CommandContext";
import { BaseCommand } from "../../structures/BaseCommand";
import { createEmbed } from "../../utils/createEmbed";
import { User } from "discord.js";

@DefineCommand({
    contextUser: "Ban Member",
    description: "Ban someone from the server",
    name: "ban",
    slash: {
        name: "ban",
        options: [
            {
                description: "Who do you like to ban?",
                name: "memberid",
                required: true,
                type: "STRING"
            }
        ]
    },
    usage: "{prefix}ban <@mention | id>"
})
export class BanCommand extends BaseCommand {
    public async execute(ctx: CommandContext): Promise<any> {
        if (!ctx.member?.permissions.has("BAN_MEMBERS")) return ctx.reply({ embeds: [createEmbed("error", "Sorry, but you don't have **`BAN MEMBERS`** permission to use this command.", true)] });
        if (!ctx.guild?.me?.permissions.has("BAN_MEMBERS")) return ctx.reply({ embeds: [createEmbed("error", "Sorry, but I don't have **`BAN MEMBERS`** permission.", true)] });

        const memberId = ctx.isContextMenu() ? (ctx.additionalArgs.get("options") as User).id : (ctx.isInteraction() ? ctx.options?.getUser("memberid", true).id : ctx.args[0]?.replace(/[^0-9]/g, ""));
        const user = await this.client.users.fetch(memberId!, { force: false }).catch(() => undefined);
        const resolved = ctx.guild.members.resolve(user!);

        if (!user) return ctx.reply({ embeds: [createEmbed("warn", "Please specify someone.")] });
        if (resolved ? !resolved.bannable : false) return ctx.reply({ embeds: [createEmbed("error", "Sorry, but I can't **\`BAN\`** that member.", true)] });

        await ctx.guild.members.ban(user);
        return ctx.reply({ embeds: [createEmbed("success", `**${user.tag}** has been **\`BANNED\`** from the server.`, true)] });
    }
}
