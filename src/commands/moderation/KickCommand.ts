import { DefineCommand } from "../../utils/decorators/DefineCommand";
import { CommandContext } from "../../structures/CommandContext";
import { BaseCommand } from "../../structures/BaseCommand";
import { createEmbed } from "../../utils/createEmbed";
import { User } from "discord.js";

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
            }
        ]
    },
    usage: "{prefix}kick <@mention | id>"
})
export class KickCommand extends BaseCommand {
    public async execute(ctx: CommandContext): Promise<any> {
        if (!ctx.member?.permissions.has("KICK_MEMBERS")) return ctx.reply({ embeds: [createEmbed("error", "Sorry, but you don't have **`KICK MEMBERS`** permission to use this command.", true)] });
        if (!ctx.guild?.me?.permissions.has("KICK_MEMBERS")) return ctx.reply({ embeds: [createEmbed("error", "Sorry, but I don't have **`KICK MEMBERS`** permission.", true)] });

        const memberId = ctx.isContextMenu() ? (ctx.additionalArgs.get("options") as User).id : (ctx.isInteraction() ? ctx.options?.getUser("member", true).id : ctx.args[0]?.replace(/[^0-9]/g, ""));
        const member = ctx.guild.members.resolve(memberId!);

        if (!member) return ctx.reply({ embeds: [createEmbed("warn", "Please specify someone.")] });
        if (!member.kickable) return ctx.reply({ embeds: [createEmbed("error", "Sorry, but I can't **\`KICK\`** that member.", true)] });

        await member.kick();
        return ctx.reply({ embeds: [createEmbed("success", `**${member.user.tag}** has been **\`KICKED\`** from the server.`, true)] });
    }
}
