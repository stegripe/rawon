/** biome-ignore-all lint/style/useNamingConvention: disable naming convention rule for this file */
import { ApplyOptions } from "@sapphire/decorators";
import { type Command } from "@sapphire/framework";
import { type CommandContext, ContextCommand } from "@stegripe/command-context";
import { PermissionFlagsBits, type SlashCommandBuilder } from "discord.js";
import i18n from "i18n";
import i18nConfig from "../../config/index.js";
import { type CommandContext as LocalCommandContext } from "../../structures/CommandContext.js";
import { type Rawon } from "../../structures/Rawon.js";
import { memberReqPerms } from "../../utils/decorators/CommonUtil.js";
import { createEmbed } from "../../utils/functions/createEmbed.js";
import { i18n__, supportedLocales } from "../../utils/functions/i18n.js";

function findLocale(input: string): string | null {
    const lowerInput = input.toLowerCase();
    return supportedLocales.find((loc) => loc.toLowerCase() === lowerInput) ?? null;
}

@ApplyOptions<Command.Options>({
    name: "language",
    aliases: ["lang", "locale"],
    description: i18nConfig.__("commands.general.language.description"),
    detailedDescription: { usage: i18nConfig.__("commands.general.language.usage") },
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
            .setName(opts.name ?? "language")
            .setDescription(opts.description ?? "Change the bot language for this server.")
            .addSubcommand((sub) =>
                sub
                    .setName("set")
                    .setDescription(i18nConfig.__("commands.general.language.slashSetDescription"))
                    .addStringOption((opt) =>
                        opt
                            .setName("locale")
                            .setDescription(
                                i18nConfig.__("commands.general.language.slashLocaleOption"),
                            )
                            .setRequired(true)
                            .addChoices(
                                ...supportedLocales.map((loc) => ({ name: loc, value: loc })),
                            ),
                    ),
            )
            .addSubcommand((sub) =>
                sub
                    .setName("view")
                    .setDescription(
                        i18nConfig.__("commands.general.language.slashViewDescription"),
                    ),
            )
            .addSubcommand((sub) =>
                sub
                    .setName("reset")
                    .setDescription(
                        i18nConfig.__("commands.general.language.slashResetDescription"),
                    ),
            ) as SlashCommandBuilder;
    },
})
export class LanguageCommand extends ContextCommand {
    private getClient(ctx: CommandContext): Rawon {
        return ctx.client as Rawon;
    }

    @memberReqPerms(["ManageGuild"], i18nConfig.__("commands.general.language.noPermission"))
    public async contextRun(ctx: CommandContext): Promise<void> {
        const localCtx = ctx as unknown as LocalCommandContext;
        const client = this.getClient(ctx);
        const guildId = ctx.guild?.id;
        if (!guildId) {
            return;
        }

        const __ = i18n__(client, ctx.guild);

        const subCommand = localCtx.options?.getSubcommand(false);
        const localeArg = localCtx.options?.getString("locale") ?? localCtx.args[0];

        if (subCommand === "reset" || localeArg?.toLowerCase() === "reset") {
            await client.data.save(() => {
                const data = client.data.data;
                const guildData = data?.[guildId];

                if (guildData) {
                    const { locale, ...rest } = guildData;
                    return {
                        ...data,
                        [guildId]: rest,
                    };
                }
                return data ?? {};
            });

            const defaultLocale = client.config.lang;
            const defaultLocale__ = (phrase: string): string =>
                i18n.__({ phrase, locale: defaultLocale });

            await ctx.reply({
                embeds: [
                    createEmbed(
                        "success",
                        `${defaultLocale__("commands.general.language.languageReset")} \`${defaultLocale}\``,
                        true,
                    ),
                ],
            });
            return;
        }

        if (subCommand === "view" || !localeArg) {
            const currentLocale = client.data.data?.[guildId]?.locale ?? client.config.lang;

            await ctx.reply({
                embeds: [
                    createEmbed(
                        "info",
                        `${__("commands.general.language.currentLanguage")} \`${currentLocale}\``,
                    )
                        .setAuthor({ name: __("commands.general.language.embedTitle") })
                        .addFields([
                            {
                                name: __("commands.general.language.availableLocales"),
                                value: supportedLocales.map((loc) => `\`${loc}\``).join(", "),
                            },
                        ]),
                ],
            });
            return;
        }

        const matchedLocale = findLocale(localeArg);
        if (!matchedLocale) {
            await ctx.reply({
                embeds: [
                    createEmbed(
                        "error",
                        `${__("commands.general.language.invalidLocale")} ${supportedLocales.map((loc) => `\`${loc}\``).join(", ")}`,
                        true,
                    ),
                ],
            });
            return;
        }

        await client.data.save(() => {
            const data = client.data.data;
            const guildData = data?.[guildId];

            return {
                ...data,
                [guildId]: {
                    ...guildData,
                    locale: matchedLocale,
                },
            };
        });

        const newLocale__ = (phrase: string): string => i18n.__({ phrase, locale: matchedLocale });

        await ctx.reply({
            embeds: [
                createEmbed(
                    "success",
                    `${newLocale__("commands.general.language.languageSet")} \`${matchedLocale}\``,
                    true,
                ),
            ],
        });
    }
}
