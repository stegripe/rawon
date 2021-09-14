import { DefineCommand } from "../../utils/decorators/DefineCommand";
import { CommandContext } from "../../structures/CommandContext";
import { BaseCommand } from "../../structures/BaseCommand";
import { createEmbed } from "../../utils/createEmbed";
import { exec } from "child_process";

@DefineCommand({
    aliases: ["$", "bash", "execute"],
    cooldown: 0,
    description: "Executes bash command",
    devOnly: true,
    name: "exec",
    usage: "{prefix}exec <bash>"
})
export class ExecCommand extends BaseCommand {
    public async execute(ctx: CommandContext): Promise<any> {
        if (!ctx.args[0]) return ctx.send({ embeds: [createEmbed("error", "Please provide bash command to execute.", true)] }, "editReply");

        const m: any = await ctx.send(`❯_ ${ctx.args.join(" ")}`);
        exec(ctx.args.join(" "), async (e: any, stdout: any, stderr: any) => {
            if (e) return m.edit(`\`\`\`js\n${e.message}\`\`\``);
            if (!stderr && !stdout) return m.edit({ embeds: [createEmbed("success", "Executed without result.", true)] });
            if (stdout) {
                const pages = this.paginate(stdout, 1950);
                for (const page of pages) {
                    await ctx.send(`\`\`\`\n${page}\`\`\``);
                }
            }
            if (stderr) {
                const pages = this.paginate(stderr, 1950);
                for (const page of pages) {
                    await ctx.send(`\`\`\`\n${page}\`\`\``);
                }
            }
        });
    }

    private paginate(text: string, limit = 2000): any[] {
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
