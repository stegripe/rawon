/* eslint-disable @typescript-eslint/no-unused-vars, no-eval, prefer-named-capture-group */
import { CommandContext } from "../../structures/CommandContext.js";
import { createEmbed } from "../../utils/functions/createEmbed.js";
import { BaseCommand } from "../../structures/BaseCommand.js";
import { Command } from "../../utils/decorators/Command.js";
import i18n from "../../config/index.js";
import { Message } from "discord.js";
import { inspect } from "node:util";

@Command<typeof EvalCommand>({
    aliases: ["evaluate", "ev", "js-exec"],
    cooldown: 0,
    description: i18n.__("commands.developers.eval.description"),
    devOnly: true,
    name: "eval",
    usage: i18n.__("commands.developers.eval.usage")
})
export class EvalCommand extends BaseCommand {
    public async execute(ctx: CommandContext): Promise<Message | undefined> {
        const msg = ctx;
        const client = this.client;

        const code = ctx.args
            .join(" ")
            .replace(/```(?:[^\s]+\n)?(.*?)\n?```/gs, (_, a: string) => a);
        const embed = createEmbed("info").addFields([{ name: i18n.__("commands.developers.eval.inputString"), value: `\`\`\`js\n${code}\`\`\`` }]);

        try {
            if (!code) {
                return await ctx.send({
                    embeds: [createEmbed("error", i18n.__("commands.developers.eval.noCode"), true)]
                });
            }

            const isAsync = /--async\s*(--silent)?$/.test(code);
            const isSilent = /--silent\s*(--async)?$/.test(code);
            const toExecute =
                isAsync || isSilent ? code.replace(/--(async|silent)\s*(--(silent|async))?$/, "") : code;
            const evaled = inspect(await eval(isAsync ? `(async () => {\n${toExecute}\n})()` : toExecute), {
                depth: 0
            });

            if (isSilent) return;

            const cleaned = this.clean(evaled);
            const output = cleaned.length > 1024 ? `${await this.hastebin(cleaned)}.js` : `\`\`\`js\n${cleaned}\`\`\``;

            embed.addFields([{ name: i18n.__("commands.developers.eval.outputString"), value: output }]);
            ctx.send({
                askDeletion: {
                    reference: ctx.author.id
                },
                embeds: [embed]
            }).catch(e => this.client.logger.error("PROMISE_ERR:", e));
        } catch (e) {
            const cleaned = this.clean(String(e));
            const isTooLong = cleaned.length > 1024;
            const error = isTooLong ? `${await this.hastebin(cleaned)}.js` : `\`\`\`js\n${cleaned}\`\`\``;

            embed.setColor("Red").addFields([{ name: i18n.__("commands.developers.eval.errorString"), value: error }]);
            ctx.send({
                askDeletion: {
                    reference: ctx.author.id
                },
                embeds: [embed]
            }).catch(er => this.client.logger.error("PROMISE_ERR:", er));
        }
    }

    // eslint-disable-next-line class-methods-use-this
    private clean(text: string): string {
        return text
            .replace(new RegExp(process.env.DISCORD_TOKEN!, "g"), "[REDACTED]")
            .replace(/`/g, `\`${String.fromCharCode(8203)}`)
            .replace(/@/g, `@${String.fromCharCode(8203)}`);
    }

    private async hastebin(text: string): Promise<string> {
        const result = await this.client.request
            .post("https://bin.clytage.org/documents", {
                body: text
            })
            .json<{ key: string }>();

        return `https://bin.clytage.org/${result.key}`;
    }
}
