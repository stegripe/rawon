import { DefineCommand } from "../../utils/decorators/DefineCommand";
import { CommandContext } from "../../structures/CommandContext";
import { BaseCommand } from "../../structures/BaseCommand";
import { createEmbed } from "../../utils/createEmbed";

@DefineCommand({
    description: "Warn member on the server",
    name: "warn",
    slash: {
        options: [
            {
                description: "Who do you like to warn?",
                name: "member",
                required: true,
                type: "USER"
            },
            {
                description: "Warn reason",
                name: "reason",
                required: false,
                type: "STRING"
            }
        ]
    },
    usage: "{prefix}warn <@mention | id> [reason]"
})
export class WarnCommand extends BaseCommand {
    public async execute(ctx: CommandContext): Promise<any> {
        if (!ctx.member?.permissions.has("MANAGE_GUILD")) return ctx.reply({ embeds: [createEmbed("error", "Sorry, but you don't have **`MANAGE SERVER`** permission to use this command.", true)] });

        const member = ctx.isInteraction() ? ctx.options?.getUser("member", true) : ctx.guild?.members.resolve(ctx.args[0]?.replace(/[^0-9]/g, ""))?.user;
        if (!member) return ctx.reply({ embeds: [createEmbed("warn", "Please specify someone.")] });

        const dm = await ctx.member.user.createDM().catch(() => undefined);
        if (!dm) await ctx.reply({ embeds: [createEmbed("warn", "Unable to create a DM with that user, but I'll keep warn 'em.")] });

        const reason = (ctx.isInteraction() ? ctx.options?.getString("reason") : (ctx.args.length >= 2 ? ctx.args.slice(1, ctx.args.length).join(" ") : undefined)) ?? "[Not Specified]";
        const embed = createEmbed("warn")
            .setAuthor(`Moderator: ${ctx.author.tag}`, ctx.author.displayAvatarURL({ dynamic: true }))
            .setDescription(`You have been warned on ${ctx.guild!.name}`)
            .addField("Reason", `\`\`\`\n${reason}\`\`\``)
            .setTimestamp(Date.now());

        await dm?.send({ embeds: [embed] });
        return ctx.reply({ embeds: [createEmbed("success", `${member.tag} has been warned`)] });
    }
}
