/* eslint-disable no-eval */
import { DefineCommand } from "../utils/decorators/DefineCommand";
import { BaseCommand } from "../structures/BaseCommand";
import { createEmbed } from "../utils/createEmbed";
import { IMessage } from "../../typings";
import { MessageEmbed } from "discord.js";
import { request } from "https";
import { inspect } from "util";

@DefineCommand({
    aliases: ["ev", "evaluate", "js-exec"],
    cooldown: 0,
    description: "Private command, only the bot owners can use this",
    name: "eval",
    usage: "{prefix}eval <some code>"
})
export class EvalCommand extends BaseCommand {
    public async execute(message: IMessage, args: string[]): Promise<any> {
        const msg = message;
        const client = this.client;

        if (!client.config.owners.includes(msg.author.id)) {
            return message.channel.send(createEmbed("error", "This command is limited to the bot owner only"));
        }

        const embed = new MessageEmbed()
            .setColor(this.client.config.embedColor)
            .addField("**Input**", `\`\`\`js\n${args.join(" ")}\`\`\``);

        try {
            const code = args.slice(0).join(" ");
            if (!code) return message.channel.send(createEmbed("error", "No code was provided"));
            let evaled = await eval(code);

            if (typeof evaled !== "string") {
                evaled = inspect(evaled, {
                    depth: 0
                });
            }

            const output = this.clean(evaled);
            if (output.length > 1024) {
                const hastebin = await this.hastebin(output);
                embed.addField("**Output**", `${hastebin}.js`);
            } else { embed.addField("**Output**", `\`\`\`js\n${output}\`\`\``); }
            await message.channel.send(embed);
        } catch (e) {
            const error = this.clean(e);
            if (error.length > 1024) {
                const hastebin = await this.hastebin(error);
                embed.addField("**Error**", `${hastebin}.js`);
            } else { embed.setColor("RED").addField("**Error**", `\`\`\`js\n${error}\`\`\``); }
            message.channel.send(embed).catch(e => this.client.logger.error("EVAL_CMD_MSG_ERR:", e));
            this.client.logger.error("EVAL_CMD_ERR:", e);
        }

        return message;
    }

    private clean(text: string): string {
        if (typeof text === "string") {
            return text
                .replace(new RegExp(process.env.SECRET_DISCORD_TOKEN!, "g"), "[REDACTED]")
                .replace(new RegExp(process.env.SECRET_YT_API_KEY!, "g"), "[REDACTED]")
                .replace(/`/g, `\`${String.fromCharCode(8203)}`)
                .replace(/@/g, `@${String.fromCharCode(8203)}`);
        } return text;
    }

    private hastebin(text: string): Promise<string> {
        return new Promise((resolve, reject) => {
            const req = request({ hostname: "bin.zhycorp.net", path: "/documents", method: "POST", minVersion: "TLSv1.3" }, res => {
                let raw = "";
                res.on("data", chunk => raw += chunk);
                res.on("end", () => {
                    if (res.statusCode! >= 200 && res.statusCode! < 300) return resolve(`https://bin.zhycorp.net/${JSON.parse(raw).key as string}`);
                    return reject(new Error(`[hastebin] Error while trying to send data to https://bin.zhycorp.net/documents, ${res.statusCode as number} ${res.statusMessage as string}`));
                });
            }).on("error", reject);
            req.write(typeof text === "object" ? JSON.stringify(text, null, 2) : text);
            req.end();
        });
    }
}
