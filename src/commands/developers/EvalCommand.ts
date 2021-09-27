/* eslint-disable @typescript-eslint/no-unused-vars, no-eval */
import { DefineCommand } from "../../utils/decorators/DefineCommand";
import { CommandContext } from "../../structures/CommandContext";
import { BaseCommand } from "../../structures/BaseCommand";
import { createEmbed } from "../../utils/createEmbed";
import { request } from "https";
import { inspect } from "util";

@DefineCommand({
    aliases: ["evaluate", "ev", "js-exec"],
    cooldown: 0,
    description: "Evaluate to the bot",
    devOnly: true,
    name: "eval",
    usage: "{prefix}eval <some code>"
})
export class EvalCommand extends BaseCommand {
    public async execute(ctx: CommandContext): Promise<any> {
        const msg = ctx;
        const client = this.client;

        const embed = createEmbed("info")
            .addField("Input", `\`\`\`js\n${ctx.args.join(" ")}\`\`\``);

        try {
            let code = ctx.args.slice(0).join(" ");
            if (!code) return ctx.send({ embeds: [createEmbed("error", "No code were provided.", true)] });
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
                embed.addField("Output", `${hastebin}.js`);
            } else { embed.addField("Output", `\`\`\`js\n${output}\`\`\``); }
            ctx.send({
                askDeletion: {
                    reference: ctx.author.id
                },
                embeds: [embed]
            }).catch(e => this.client.logger.error("PROMISE_ERR:", e));
        } catch (e) {
            const error = this.clean(String(e));
            if (error.length > 1024) {
                const hastebin = await this.hastebin(error);
                embed.addField("Error", `${hastebin}.js`);
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

    private hastebin(text: any): Promise<string> {
        return new Promise((resolve, reject) => {
            const req = request({ hostname: "bin.zhycorp.net", path: "/documents", method: "POST", minVersion: "TLSv1.3" }, res => {
                let raw = "";
                res.on("data", chunk => raw += chunk);
                res.on("end", () => {
                    if (res.statusCode! >= 200 && res.statusCode! < 300) return resolve(`https://bin.zhycorp.net/${JSON.parse(raw).key}`);
                    return reject(
                        new Error(`[hastebin] Error while trying to send data to https://bin.zhycorp.net/documents,` +
                        `${res.statusCode?.toString() as string} ${res.statusMessage?.toString() as string}`)
                    );
                });
            }).on("error", reject);
            req.write(typeof text === "object" ? JSON.stringify(text, null, 2) : text);
            req.end();
        });
    }
}
