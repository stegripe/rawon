import { CommandContext } from "#rawon/structures/CommandContext.js";
import { createEmbed } from "#rawon/utils/functions/createEmbed.js";
import { BaseCommand } from "#rawon/structures/BaseCommand.js";
import { Command } from "#rawon/utils/decorators/Command.js";
import { ChildProcess, spawn } from "node:child_process";
import { Collection } from "discord.js";
import kill from "tree-kill";

@Command<typeof SpawnCommand>({
    description: "Spawn process for executing bash commands",
    devOnly: true,
    name: "spawn",
    usage: "{prefix}spawn <option>"
})
export class SpawnCommand extends BaseCommand {
    private readonly processes = new Collection<string, ChildProcess>();

    public async execute(ctx: CommandContext): Promise<void> {
        const option = ctx.args.shift();

        if (option === "create") {
            const name = ctx.args.shift();
            if (!name) {
                void ctx.reply({ embeds: [createEmbed("error", "Please provide the process name.", true)] });
                return;
            }
            if (!ctx.args.length) {
                void ctx.reply({ embeds: [createEmbed("error", "Please provide a command to execute.", true)] });
                return;
            }
            if (this.processes.has(name)) {
                void ctx.reply({ embeds: [createEmbed("warn", "There's a running process with that name. Terminate it first, and then try again.")] });
                return;
            }

            await ctx.reply({ embeds: [createEmbed("info", `❯_ ${ctx.args.join(" ")}`)] });
            const process = spawn(ctx.args.shift()!, ctx.args, { shell: true, windowsHide: true })
                .on("spawn", () => {
                    void ctx.reply({ embeds: [createEmbed("success", `Process **\`${name}\`** has spawned.`, true)] });
                })
                .on("close", (code, signal) => {
                    this.processes.delete(name);
                    void ctx.reply({ embeds: [createEmbed("warn", `Process **\`${name}\`** closed with code **\`${code!}\`**, signal **\`${signal!}\`**`)] });
                })
                .on("error", err => {
                    void ctx.reply({ embeds: [createEmbed("error", `An error occured on the process **\`${name}\`**: \n\`\`\`${err.message}\`\`\``, true)] });
                });

            process.stdout.on("data", async data => {
                const pages = SpawnCommand.paginate(String(data), 1950);
                for (const page of pages) {
                    await ctx.reply(`\`\`\`\n${page}\`\`\``);
                }
            });
            process.stderr.on("data", async data => {
                const pages = SpawnCommand.paginate(String(data), 1950);
                for (const page of pages) {
                    await ctx.reply(`\`\`\`\n${page}\`\`\``);
                }
            });

            this.processes.set(name, process);
        } else if (option === "terminate") {
            const name = ctx.args.shift();
            if (!name) {
                void ctx.reply({ embeds: [createEmbed("error", "Please provide the process name.", true)] });
                return;
            }
            if (!this.processes.has(name)) {
                void ctx.reply({ embeds: [createEmbed("error", "There's no process with that name.", true)] });
                return;
            }

            const process = this.processes.get(name)!;

            try {
                if (process.pid) {
                    await new Promise<void>((resolve, reject) => {
                        kill(process.pid!, "SIGTERM", err => {
                            if (err) reject(err);
                            else resolve();
                        });
                    });
                }
                this.processes.delete(name);

                void ctx.reply({
                    embeds: [createEmbed("success", "Process has terminated.", true)]
                });
            } catch (err) {
                void ctx.reply({
                    embeds: [createEmbed("error", `An error occured while trying to terminate process: ${(err as Error).message}`)]
                });
            }
        } else {
            void ctx.reply({ embeds: [createEmbed("error", "Invalid usage, valid options are **`create`** and **`terminate`**", true)] });
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
