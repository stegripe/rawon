import { CommandContext } from "../../structures/CommandContext.js";
import { createEmbed } from "../../utils/functions/createEmbed.js";
import { BaseCommand } from "../../structures/BaseCommand.js";
import { Command } from "../../utils/decorators/Command.js";
import { execSync } from "node:child_process";

@Command<typeof ExecCommand>({
    aliases: ["$", "bash", "execute"],
    description: "Executes bash command",
    devOnly: true,
    name: "exec",
    usage: "{prefix}exec <bash>"
})
export class ExecCommand extends BaseCommand {
    public async execute(ctx: CommandContext): Promise<void> {
        if (!ctx.args.length) {
            await ctx.reply({
                embeds: [createEmbed("error", "Please provide a bash command to execute.", true)]
            });
            return;
        }

        const m = await ctx.reply({ content: `❯_ ${ctx.args.join(" ")}` });
        try {
            const exec = execSync(ctx.args.join(" "), { encoding: "utf-8" });
            const pages = ExecCommand.paginate(exec);
            for (const page of pages) {
                await ctx.channel?.send(`\`\`\`\n${page}\`\`\``);
            }
        } catch (e) {
            await m.edit(`\`\`\`js\n${(e as Error).message}\`\`\``);
        }
    }

    private static paginate(text: string, limit = 2000): string[] {
        const lines = text.trim().split("\n");
        const pages = [];
        let chunk = "";

        for (const line of lines) {
            if (chunk.length + line.length > limit && chunk.length > 0) {
                pages.push(chunk);
                chunk = "";
            }

            if (line.length > limit) {
                const lineChunks = line.length / limit;

                for (let i = 0; i < lineChunks; i++) {
                    const start = i * limit;
                    const end = start + limit;
                    pages.push(line.slice(start, end));
                }
            } else {
                chunk += `${line}\n`;
            }
        }

        if (chunk.length > 0) {
            pages.push(chunk);
        }

        return pages;
    }
}
