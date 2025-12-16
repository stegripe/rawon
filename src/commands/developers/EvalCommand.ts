/* eslint-disable typescript/no-unused-vars */
/* eslint-disable unicorn/catch-error-name */
/* eslint-disable prefer-named-capture-group */
/* eslint-disable no-eval */
import process from "node:process";
import { inspect } from "node:util";
import i18n from "../../config/index.js";
import { BaseCommand } from "../../structures/BaseCommand.js";
import { type CommandContext } from "../../structures/CommandContext.js";
import { Command } from "../../utils/decorators/Command.js";
import { createEmbed } from "../../utils/functions/createEmbed.js";

@Command<typeof EvalCommand>({
    aliases: ["evaluate", "ev", "js-exec"],
    cooldown: 0,
    description: i18n.__("commands.developers.eval.description"),
    devOnly: true,
    name: "eval",
    usage: i18n.__("commands.developers.eval.usage"),
})
export class EvalCommand extends BaseCommand {
    public async execute(ctx: CommandContext): Promise<void> {
        const _msg = ctx;
        const _client = this.client;

        const code = ctx.args
            .join(" ")
            .replaceAll(/```(?:\S+\n)?(.*?)\n?```/gsu, (_, a: string) => a);
        const embed = createEmbed("info").addFields([
            {
                name: i18n.__("commands.developers.eval.inputString"),
                value: `\`\`\`js\n${code}\`\`\``,
            },
        ]);

        try {
            if (!code) {
                await ctx.send({
                    embeds: [
                        createEmbed("error", i18n.__("commands.developers.eval.noCode"), true),
                    ],
                });
                return;
            }

            const isAsync = /--async\s*(--silent)?$/u.test(code);
            const isSilent = /--silent\s*(--async)?$/u.test(code);
            const toExecute =
                isAsync || isSilent
                    ? code.replace(/--(async|silent)\s*(--(silent|async))?$/u, "")
                    : code;
            const evaled = inspect(
                await eval(isAsync ? `(async () => {\n${toExecute}\n})()` : toExecute),
                {
                    depth: 0,
                },
            );

            if (isSilent) {
                return;
            }

            const cleaned = this.clean(evaled);
            const output =
                cleaned.length > 1_024
                    ? `${await this.hastebin(cleaned)}.js`
                    : `\`\`\`js\n${cleaned}\`\`\``;

            embed.addFields([
                { name: i18n.__("commands.developers.eval.outputString"), value: output },
            ]);
            await ctx
                .send({
                    askDeletion: {
                        reference: ctx.author.id,
                    },
                    embeds: [embed],
                })
                .catch((error: unknown) => this.client.logger.error("PROMISE_ERR:", error));
        } catch (error_) {
            const cleaned = this.clean(String(error_));
            const isTooLong = cleaned.length > 1_024;
            const error = isTooLong
                ? `${await this.hastebin(cleaned)}.js`
                : `\`\`\`js\n${cleaned}\`\`\``;

            embed
                .setColor("Red")
                .addFields([
                    { name: i18n.__("commands.developers.eval.errorString"), value: error },
                ]);
            await ctx
                .send({
                    askDeletion: {
                        reference: ctx.author.id,
                    },
                    embeds: [embed],
                })
                .catch((err: unknown) => this.client.logger.error("PROMISE_ERR:", err));
        }
    }

    private clean(text: string): string {
        return text
            .replaceAll(
                new RegExp(process.env.DISCORD_TOKEN ?? "thereshouldbetokenhere", "gu"),
                "[REDACTED]",
            )
            .replaceAll("`", `\`${String.fromCodePoint(8_203)}`)
            .replaceAll("@", `@${String.fromCodePoint(8_203)}`);
    }

    private async hastebin(text: string): Promise<string> {
        const result = await this.client.request
            .post("https://bin.stegripe.org/documents", {
                body: text,
            })
            .json<{ key: string }>();

        return `https://bin.stegripe.org/${result.key}`;
    }
}
