/** biome-ignore-all lint/style/useNamingConvention: disable naming convention rule for this file */
import { ApplyOptions } from "@sapphire/decorators";
import { type Command } from "@sapphire/framework";
import { type CommandContext, ContextCommand } from "@stegripe/command-context";
import { PermissionFlagsBits, type SlashCommandBuilder } from "discord.js";
import i18n from "../../config/index.js";
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
    private get client(): Rawon {
        return this.container.client as Rawon;
    }

    @memberReqPerms(["ManageGuild"], i18n.__("commands.general.prefix.noPermission"))
    public async contextRun(ctx: CommandContext): Promise<void> {
        const guildId = ctx.guild?.id;
        if (!guildId) {
            return;
        }

        const __ = i18n__(this.client, ctx.guild);
        const __mf = i18n__mf(this.client, ctx.guild);

        const subCommand = ctx.options?.getSubcommand(false);
        const prefixArg = ctx.options?.getString("prefix") ?? ctx.args[0];

        if (subCommand === "reset" || prefixArg?.toLowerCase() === "reset") {
            await this.client.data.setPrefix(guildId, null);

            await ctx.reply({
                embeds: [
                    createEmbed(
                        "success",
                        __mf("commands.general.prefix.prefixReset", {
                            prefix: `\`${this.client.config.mainPrefix}\``,
                        }),
                        true,
                    ),
                ],
            });
            return;
        }

        if (subCommand === "view" || !prefixArg) {
            let currentPrefix =
                this.client.data.data?.[guildId]?.prefix ?? this.client.config.mainPrefix;
            if (currentPrefix === "") {
                currentPrefix = this.client.config.mainPrefix;
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

        await this.client.data.setPrefix(guildId, prefixArg);

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
