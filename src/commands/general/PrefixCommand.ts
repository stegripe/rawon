/** biome-ignore-all lint/style/useNamingConvention: disable naming convention rule for this file */
import { ApplyOptions } from "@sapphire/decorators";
import { type Command } from "@sapphire/framework";
import { type CommandContext, ContextCommand } from "@stegripe/command-context";
import { PermissionFlagsBits, type SlashCommandBuilder } from "discord.js";
import i18n from "../../config/index.js";
import { type CommandContext as LocalCommandContext } from "../../structures/CommandContext.js";
import { type Rawon } from "../../structures/Rawon.js";
import { memberReqPerms } from "../../utils/decorators/CommonUtil.js";
import { createEmbed } from "../../utils/functions/createEmbed.js";
import { i18n__, i18n__mf } from "../../utils/functions/i18n.js";

@ApplyOptions<Command.Options>({
    name: "prefix",
    aliases: ["setprefix"],
    description: i18n.__("commands.general.prefix.description"),
    detailedDescription: { usage: i18n.__("commands.general.prefix.usage") },
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
            .setName(opts.name ?? "prefix")
            .setDescription(opts.description ?? "Change the bot prefix for this server.")
            .addSubcommand((sub) =>
                sub
                    .setName("set")
                    .setDescription(i18n.__("commands.general.prefix.slashSetDescription"))
                    .addStringOption((opt) =>
                        opt
                            .setName("prefix")
                            .setDescription(i18n.__("commands.general.prefix.slashPrefixOption"))
                            .setRequired(true),
                    ),
            )
            .addSubcommand((sub) =>
                sub
                    .setName("view")
                    .setDescription(i18n.__("commands.general.prefix.slashViewDescription")),
            )
            .addSubcommand((sub) =>
                sub
                    .setName("reset")
                    .setDescription(i18n.__("commands.general.prefix.slashResetDescription")),
            ) as SlashCommandBuilder;
    },
})
export class PrefixCommand extends ContextCommand {
    private getClient(ctx: CommandContext): Rawon {
        return ctx.client as Rawon;
    }

    @memberReqPerms(["ManageGuild"], i18n.__("commands.general.prefix.noPermission"))
    public async contextRun(ctx: CommandContext): Promise<void> {
        const localCtx = ctx as unknown as LocalCommandContext;
        const client = this.getClient(ctx);
        const guildId = ctx.guild?.id;
        if (!guildId) {
            return;
        }

        const __ = i18n__(client, ctx.guild);
        const __mf = i18n__mf(client, ctx.guild);

        const subCommand = localCtx.options?.getSubcommand(false);
        const prefixArg = localCtx.options?.getString("prefix") ?? localCtx.args[0];

        if (subCommand === "reset" || prefixArg?.toLowerCase() === "reset") {
            await client.data.setPrefix(guildId, null);

            await ctx.reply({
                embeds: [
                    createEmbed(
                        "success",
                        __mf("commands.general.prefix.prefixReset", {
                            prefix: `\`${client.config.mainPrefix}\``,
                        }),
                        true,
                    ),
                ],
            });
            return;
        }

        if (subCommand === "view" || !prefixArg) {
            let currentPrefix = client.data.data?.[guildId]?.prefix ?? client.config.mainPrefix;
            if (currentPrefix === "") {
                currentPrefix = client.config.mainPrefix;
            }

            await ctx.reply({
                embeds: [
                    createEmbed(
                        "info",
                        __mf("commands.general.prefix.currentPrefix", {
                            prefix: `\`${currentPrefix}\``,
                        }),
                    ).setAuthor({ name: __("commands.general.prefix.embedTitle") }),
                ],
            });
            return;
        }

        if (prefixArg.length > 10) {
            await ctx.reply({
                embeds: [createEmbed("error", __("commands.general.prefix.prefixTooLong"), true)],
            });
            return;
        }

        await client.data.setPrefix(guildId, prefixArg);

        await ctx.reply({
            embeds: [
                createEmbed(
                    "success",
                    __mf("commands.general.prefix.prefixSet", {
                        prefix: `\`${prefixArg}\``,
                    }),
                    true,
                ),
            ],
        });
    }
}
