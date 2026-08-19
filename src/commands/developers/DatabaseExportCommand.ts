import { Buffer } from "node:buffer";
import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import process from "node:process";
import { ApplyOptions } from "@sapphire/decorators";
import { type Command } from "@sapphire/framework";
import { type CommandContext, ContextCommand } from "@stegripe/command-context";
import {
    AttachmentBuilder,
    MessageFlags,
    PermissionFlagsBits,
    type SlashCommandBuilder,
} from "discord.js";
import i18n from "../../config/index.js";
import { type Rawon } from "../../structures/Rawon.js";
import { createEmbed } from "../../utils/functions/createEmbed.js";
import { i18n__, i18n__mf } from "../../utils/functions/i18n.js";

const EXPORT_VERSION = "1.0.0";

@ApplyOptions<Command.Options>({
    name: "db-export",
    aliases: ["database-export", "export-db", "dbexport"],
    description: i18n.__("commands.developers.dbExport.description"),
    preconditions: ["DevOnly"],
    cooldownDelay: 0,
    requiredClientPermissions: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.EmbedLinks,
        PermissionFlagsBits.AttachFiles,
    ],
    chatInputCommand(
        builder: Parameters<NonNullable<Command.Options["chatInputCommand"]>>[0],
        opts: Parameters<NonNullable<Command.Options["chatInputCommand"]>>[1],
    ): SlashCommandBuilder {
        return builder
            .setName(opts.name ?? "db-export")
            .setDescription(
                opts.description ?? i18n.__("commands.developers.dbExport.description"),
            ) as SlashCommandBuilder;
    },
})
export class DatabaseExportCommand extends ContextCommand {
    public async contextRun(ctx: CommandContext): Promise<void> {
        if (ctx.isChatInputInteractionContext() && !ctx.deferred) {
            await ctx.deferReply({ flags: MessageFlags.Ephemeral });
        }

        const client = ctx.client as Rawon;
        const __ = i18n__(client, ctx.guild);
        const __mf = i18n__mf(client, ctx.guild);

        try {
            const tables = client.data.exportAllTables();

            const exportData = {
                exportedAt: new Date().toISOString(),
                version: EXPORT_VERSION,
                tables,
            };

            const jsonContent = JSON.stringify(exportData, null, 2);
            const fileName = `rawon-db-export-${Date.now()}.json`;
            const dataDir = join(process.cwd(), "data");
            const dataPath = join(dataDir, fileName);

            await writeFile(dataPath, jsonContent, "utf-8");

            const stats = Object.entries(tables)
                .map(([name, rows]) => `**${name}:** \`${rows.length}\``)
                .join("\n");
            const totalRecords = Object.values(tables).reduce((a, rows) => a + rows.length, 0);

            const attachment = new AttachmentBuilder(Buffer.from(jsonContent, "utf-8"), {
                name: fileName,
            });

            await ctx.reply({
                embeds: [
                    createEmbed(
                        "success",
                        `${__("commands.developers.dbExport.success")}\n\n` +
                            `**${__("commands.developers.dbExport.totalRecords")}:** \`${totalRecords}\`\n${stats}\n\n` +
                            `📁 ${__mf("commands.developers.dbExport.savedTo", { path: dataPath })}`,
                    ),
                ],
                files: [attachment],
            });
        } catch (error) {
            this.container.logger.error(error, "Failed to export database");
            await ctx.reply({
                embeds: [
                    createEmbed(
                        "error",
                        __mf("commands.developers.dbExport.failed", {
                            error: error instanceof Error ? error.message : "Unknown error",
                        }),
                    ),
                ],
            });
        }
    }
}
