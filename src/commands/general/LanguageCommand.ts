import { ApplicationCommandOptionType } from "discord.js";
import i18n from "i18n";
import i18nConfig from "../../config/index.js";
import { BaseCommand } from "../../structures/BaseCommand.js";
import { type CommandContext } from "../../structures/CommandContext.js";
import { Command } from "../../utils/decorators/Command.js";
import { memberReqPerms } from "../../utils/decorators/CommonUtil.js";
import { createEmbed } from "../../utils/functions/createEmbed.js";
import { i18n__, isSupportedLocale, supportedLocales } from "../../utils/functions/i18n.js";

@Command<typeof LanguageCommand>({
    aliases: ["lang", "locale"],
    description: i18nConfig.__("commands.general.language.description"),
    name: "language",
    slash: {
        options: [
            {
                description: i18nConfig.__("commands.general.language.slashSetDescription"),
                name: "set",
                options: [
                    {
                        description: i18nConfig.__("commands.general.language.slashLocaleOption"),
                        name: "locale",
                        required: true,
                        type: ApplicationCommandOptionType.String,
                        choices: supportedLocales.map((loc) => ({ name: loc, value: loc })),
                    },
                ],
                type: ApplicationCommandOptionType.Subcommand,
            },
            {
                description: i18nConfig.__("commands.general.language.slashViewDescription"),
                name: "view",
                type: ApplicationCommandOptionType.Subcommand,
            },
        ],
    },
    usage: i18nConfig.__("commands.general.language.usage"),
})
export class LanguageCommand extends BaseCommand {
    @memberReqPerms(["ManageGuild"], i18nConfig.__("commands.general.language.noPermission"))
    public async execute(ctx: CommandContext): Promise<void> {
        const guildId = ctx.guild?.id;
        if (!guildId) {
            return;
        }

        const __ = i18n__(this.client, ctx.guild);

        const subCommand = ctx.options?.getSubcommand(false);
        const localeArg = ctx.options?.getString("locale") ?? ctx.args[0];

        // View current language
        if (subCommand === "view" || !localeArg) {
            const currentLocale =
                this.client.data.data?.[guildId]?.locale ?? this.client.config.lang;

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

        // Set new language
        if (!isSupportedLocale(localeArg)) {
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

        await this.client.data.save(() => {
            const data = this.client.data.data;
            const guildData = data?.[guildId];

            return {
                ...data,
                [guildId]: {
                    ...guildData,
                    locale: localeArg,
                },
            };
        });

        // Use the new locale directly for the response message
        const newLocale__ = (phrase: string): string => i18n.__({ phrase, locale: localeArg });

        await ctx.reply({
            embeds: [
                createEmbed(
                    "success",
                    `${newLocale__("commands.general.language.languageSet")} \`${localeArg}\``,
                    true,
                ),
            ],
        });
    }
}
