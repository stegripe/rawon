/* eslint-disable @typescript-eslint/no-unused-vars, no-eval */
import { CommandContext } from "../../structures/CommandContext";
import { BaseCommand } from "../../structures/BaseCommand";
import { createEmbed } from "../../utils/createEmbed";
import i18n from "../../config";
import { Message } from "discord.js";
import { inspect } from "util";

export class EvalCommand extends BaseCommand {
    public constructor(client: BaseCommand["client"]) {
        super(client, {
            aliases: ["evaluate", "ev", "js-exec"],
            cooldown: 0,
            description: i18n.__("commands.developers.eval.description"),
            devOnly: true,
            name: "eval",
            usage: i18n.__("commands.developers.eval.usage")
        });
    }

    public async execute(ctx: CommandContext): Promise<Message|void> {
        const msg = ctx;
        const client = this.client;

        const embed = createEmbed("info")
            .addField("Input", `\`\`\`js\n${ctx.args.join(" ")}\`\`\``);

        try {
            let code = ctx.args.join(" ");
            if (!code) return ctx.send({ embeds: [createEmbed("error", i18n.__("commands.developers.eval.noCode"), true)] });
            let evaled;
            if (code.includes("--silent") && code.includes("--async")) {
                code = code.replace("--async", "").replace("--silent", "");
                await eval(`(async () => {
                            ${code}
                        })()`);
                return;
            } else if (code.includes("--async")) {
                code = code.replace("--async", "");
                evaled = await eval(`(async () => {
                            ${code}
                        })()`);
            } else if (code.includes("--silent")) {
                code = code.replace("--silent", "");
                await eval(code);
                return;
            } else {
                evaled = await eval(code);
            }
            if (typeof evaled !== "string") {
                evaled = inspect(evaled, {
                    depth: 0
                });
            }

            const output = this.clean(evaled);
            if (output.length > 1024) {
                const hastebin = await this.hastebin(output);
                embed.addField(i18n.__("commands.developers.eval.outputString"), `${hastebin}.js`);
            } else { embed.addField(i18n.__("commands.developers.eval.outputString"), `\`\`\`js\n${output}\`\`\``); }
            ctx.send({
                askDeletion: {
                    reference: ctx.author.id
                },
                embeds: [embed]
            }).catch(e => this.client.logger.error("PROMISE_ERR:", e));
        } catch (e) {
            const error = this.clean(e as string);
            if (error.length > 1024) {
                const hastebin = await this.hastebin(error);
                embed.addField(i18n.__("commands.developers.eval.errorString"), `${hastebin}.js`);
            } else { embed.setColor("RED").addField("Error", `\`\`\`js\n${error}\`\`\``); }
            ctx.send({
                askDeletion: {
                    reference: ctx.author.id
                },
                embeds: [embed]
            }).catch(e => this.client.logger.error("PROMISE_ERR:", e));
        }
    }

    private clean(text: string): string {
        if (typeof text === "string") {
            return text
                .replace(new RegExp(process.env.DISCORD_TOKEN!, "g"), "[REDACTED]")
                .replace(/`/g, `\`${String.fromCharCode(8203)}`)
                .replace(/@/g, `@${String.fromCharCode(8203)}`);
        }
        return text;
    }

    private async hastebin(text: string): Promise<string> {
        const result = await this.client.request.post("https://bin.zhycorp.net/documents", {
            body: text
        }).json<{ key: string }>();

        return `https://bin.zhycorp.net/${result.key}`;
    }
}
