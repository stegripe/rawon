import { ApplicationCommandOptionType } from "discord.js";
import i18n from "i18n";
import i18nConfig from "../../config/index.js";
import { BaseCommand } from "../../structures/BaseCommand.js";
import { type CommandContext } from "../../structures/CommandContext.js";
import { Command } from "../../utils/decorators/Command.js";
import { memberReqPerms } from "../../utils/decorators/CommonUtil.js";
import { createEmbed } from "../../utils/functions/createEmbed.js";
import {
    i18n__,
    i18n__mf,
    isSupportedLocale,
    supportedLocales,
} from "../../utils/functions/i18n.js";

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
        const __mf = i18n__mf(this.client, ctx.guild);

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
                        __mf("commands.general.language.currentLanguage", {
                            locale: currentLocale,
                        }),
                    )
                        .setAuthor({ name: __("commands.general.language.embedTitle") })
                        .addFields([
                            {
                                name: __("commands.general.language.availableLocales"),
                                value: supportedLocales.join(", "),
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
                        __mf("commands.general.language.invalidLocale", {
                            locales: supportedLocales.join(", "),
                        }),
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
        await ctx.reply({
            embeds: [
                createEmbed(
                    "success",
                    i18n.__mf(
                        { phrase: "commands.general.language.languageSet", locale: localeArg },
                        { locale: localeArg },
                    ),
                    true,
                ),
            ],
        });
    }
}
