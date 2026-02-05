/** biome-ignore-all lint/style/useNamingConvention: disable naming convention rule for this file */
import process from "node:process";
import { inspect } from "node:util";
import { ApplyOptions } from "@sapphire/decorators";
import { type Command } from "@sapphire/framework";
import { type CommandContext, ContextCommand } from "@stegripe/command-context";
import { PermissionFlagsBits, type SlashCommandBuilder } from "discord.js";
import i18n from "../../config/index.js";
import { type CommandContext as LocalCommandContext } from "../../structures/CommandContext.js";
import { type Rawon } from "../../structures/Rawon.js";
import { createEmbed } from "../../utils/functions/createEmbed.js";
import { i18n__ } from "../../utils/functions/i18n.js";

@ApplyOptions<Command.Options>({
    name: "eval",
    aliases: ["evaluate", "ev", "js-exec"],
    description: i18n.__("commands.developers.eval.description"),
    detailedDescription: { usage: i18n.__("commands.developers.eval.usage") },
    preconditions: ["DevOnly"],
    cooldownDelay: 0,
    requiredClientPermissions: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.EmbedLinks,
    ],
    chatInputCommand(
        builder: Parameters<NonNullable<Command.Options["chatInputCommand"]>>[0],
        opts: Parameters<NonNullable<Command.Options["chatInputCommand"]>>[1],
    ): SlashCommandBuilder {
        return builder
            .setName(opts.name ?? "eval")
            .setDescription(opts.description ?? "Evaluate JavaScript code.") as SlashCommandBuilder;
    },
})
export class EvalCommand extends ContextCommand {
    public async contextRun(ctx: CommandContext): Promise<void> {
        const localCtx = ctx as unknown as LocalCommandContext;
        const client = localCtx.client as Rawon;
        const __ = i18n__(client, localCtx.guild);
        const _msg = localCtx;
        const _client = client;

        const code = localCtx.args
            .join(" ")
            .replaceAll(/```(?:\S+\n)?(.*?)\n?```/gsu, (_: string, a: string) => a);
        const embed = createEmbed("info").addFields([
            {
                name: __("commands.developers.eval.inputString"),
                value: `\`\`\`js\n${code}\`\`\``,
            },
        ]);

        try {
            if (!code) {
                await localCtx.send({
                    embeds: [createEmbed("error", __("commands.developers.eval.noCode"), true)],
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
                    ? `${await this.hastebin(client, cleaned)}.js`
                    : `\`\`\`js\n${cleaned}\`\`\``;

            embed.addFields([{ name: __("commands.developers.eval.outputString"), value: output }]);
            await localCtx
                .send({
                    embeds: [embed],
                })
                .catch((error: unknown) => this.container.logger.error("PROMISE_ERR:", error));
        } catch (error_) {
            const cleaned = this.clean(String(error_));
            const isTooLong = cleaned.length > 1_024;
            const error = isTooLong
                ? `${await this.hastebin(client, cleaned)}.js`
                : `\`\`\`js\n${cleaned}\`\`\``;

            embed
                .setColor("Red")
                .addFields([{ name: __("commands.developers.eval.errorString"), value: error }]);
            await localCtx
                .send({
                    embeds: [embed],
                })
                .catch((err: unknown) => this.container.logger.error("PROMISE_ERR:", err));
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

    private async hastebin(client: Rawon, text: string): Promise<string> {
        const result = await client.request
            .post("https://bin.stegripe.org/documents", {
                body: text,
                headers: {
                    "content-type": "text/plain; charset=utf-8",
                },
            })
            .json<{ key: string }>();

        return `https://bin.stegripe.org/${result.key}`;
    }
}
