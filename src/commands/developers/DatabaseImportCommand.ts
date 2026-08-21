import { readFile } from "node:fs/promises";
import { join } from "node:path";
import process from "node:process";
import { ApplyOptions } from "@sapphire/decorators";
import { type Command } from "@sapphire/framework";
import { type CommandContext, ContextCommand } from "@stegripe/command-context";
import { Message, MessageFlags, PermissionFlagsBits, type SlashCommandBuilder } from "discord.js";
import got from "got";
import i18n from "../../config/index.js";
import { type Rawon } from "../../structures/Rawon.js";
import { createEmbed } from "../../utils/functions/createEmbed.js";
import { i18n__, i18n__mf } from "../../utils/functions/i18n.js";

interface DatabaseExport {
    exportedAt: string;
    version: string;
    tables: Record<string, unknown[]>;
}

@ApplyOptions<Command.Options>({
    name: "db-import",
    aliases: ["database-import", "import-db", "dbimport"],
    description: i18n.__("commands.developers.dbImport.description"),
    preconditions: ["DevOnly"],
    cooldownDelay: 0,
    detailedDescription: {
        usage: i18n.__("commands.developers.dbImport.usage"),
    },
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
            .setName(opts.name ?? "db-import")
            .setDescription(opts.description ?? i18n.__("commands.developers.dbImport.description"))
            .addAttachmentOption((option) =>
                option
                    .setName("file")
                    .setDescription(i18n.__("commands.developers.dbImport.slashFileDescription"))
                    .setRequired(false),
            )
            .addStringOption((option) =>
                option
                    .setName("url")
                    .setDescription(i18n.__("commands.developers.dbImport.slashUrlDescription"))
                    .setRequired(false),
            ) as SlashCommandBuilder;
    },
})
export class DatabaseImportCommand extends ContextCommand {
    public async contextRun(ctx: CommandContext): Promise<void> {
        if (ctx.isChatInputInteractionContext() && !ctx.deferred) {
            await ctx.deferReply({ flags: MessageFlags.Ephemeral });
        }

        const client = ctx.client as Rawon;
        const __ = i18n__(client, ctx.guild);
        const __mf = i18n__mf(client, ctx.guild);

        try {
            let jsonContent: string | null = null;

            if (ctx.isChatInputInteractionContext()) {
                const attachment = ctx.options.getAttachment("file");
                const urlOrFilename = ctx.options.getString("url");

                if (attachment) {
                    if (!attachment.name?.endsWith(".json")) {
                        await ctx.reply({
                            embeds: [
                                createEmbed("warn", __("commands.developers.dbImport.provideJson")),
                            ],
                        });
                        return;
                    }
                    jsonContent = await got(attachment.url).text();
                } else if (urlOrFilename) {
                    if (urlOrFilename.startsWith("http")) {
                        jsonContent = await got(urlOrFilename).text();
                    } else {
                        const filePath = join(process.cwd(), "data", urlOrFilename);
                        jsonContent = await readFile(filePath, "utf-8");
                    }
                }
            } else if (ctx.context instanceof Message) {
                const attachment = ctx.context.attachments.first();

                if (attachment) {
                    if (!attachment.name?.endsWith(".json")) {
                        await ctx.reply({
                            embeds: [
                                createEmbed("warn", __("commands.developers.dbImport.provideJson")),
                            ],
                        });
                        return;
                    }
                    jsonContent = await got(attachment.url).text();
                } else if (ctx.isMessageContext() && ctx.args) {
                    const urlOrFilename = await ctx.args.rest("string").catch(() => null);
                    if (urlOrFilename) {
                        if (urlOrFilename.startsWith("http")) {
                            jsonContent = await got(urlOrFilename).text();
                        } else {
                            const filePath = join(process.cwd(), "data", urlOrFilename);
                            jsonContent = await readFile(filePath, "utf-8");
                        }
                    }
                }
            }

            if (!jsonContent) {
                await ctx.reply({
                    embeds: [
                        createEmbed("warn", __("commands.developers.dbImport.provideJsonHint")),
                    ],
                });
                return;
            }

            const data = JSON.parse(jsonContent) as DatabaseExport;

            if (!data.tables || !data.version) {
                await ctx.reply({
                    embeds: [
                        createEmbed("error", __("commands.developers.dbImport.invalidFormat")),
                    ],
                });
                return;
            }

            const { stats, total } = client.data.importAllTables(data.tables);

            const statsText = Object.entries(stats)
                .map(([name, count]) => `**${name}:** \`${count}\``)
                .join("\n");

            await ctx.reply({
                embeds: [
                    createEmbed(
                        "success",
                        `${__("commands.developers.dbImport.success")}\n\n` +
                            `**${__("commands.developers.dbImport.totalRecords")}:** \`${total}\`\n${statsText}\n\n` +
                            `📅 ${__("commands.developers.dbImport.exportDate")}: \`${data.exportedAt}\`\n` +
                            `📦 ${__("commands.developers.dbImport.version")}: \`${data.version}\``,
                    ),
                ],
            });
        } catch (error) {
            this.container.logger.error(error, "Failed to import database");
            await ctx.reply({
                embeds: [
                    createEmbed(
                        "error",
                        __mf("commands.developers.dbImport.failed", {
                            error: error instanceof Error ? error.message : "Unknown error",
                        }),
                    ),
                ],
            });
        }
    }
}
