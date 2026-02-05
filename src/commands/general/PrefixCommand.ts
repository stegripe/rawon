import { ApplicationCommandOptionType } from "discord.js";
import i18n from "../../config/index.js";
import { BaseCommand } from "../../structures/BaseCommand.js";
import { type CommandContext } from "../../structures/CommandContext.js";
import { Command } from "../../utils/decorators/Command.js";
import { memberReqPerms } from "../../utils/decorators/CommonUtil.js";
import { createEmbed } from "../../utils/functions/createEmbed.js";
import { i18n__, i18n__mf } from "../../utils/functions/i18n.js";

@Command<typeof PrefixCommand>({
    aliases: ["setprefix"],
    description: i18n.__("commands.general.prefix.description"),
    name: "prefix",
    slash: {
        options: [
            {
                description: i18n.__("commands.general.prefix.slashSetDescription"),
                name: "set",
                options: [
                    {
                        description: i18n.__("commands.general.prefix.slashPrefixOption"),
                        name: "prefix",
                        required: true,
                        type: ApplicationCommandOptionType.String,
                    },
                ],
                type: ApplicationCommandOptionType.Subcommand,
            },
            {
                description: i18n.__("commands.general.prefix.slashViewDescription"),
                name: "view",
                type: ApplicationCommandOptionType.Subcommand,
            },
            {
                description: i18n.__("commands.general.prefix.slashResetDescription"),
                name: "reset",
                type: ApplicationCommandOptionType.Subcommand,
            },
        ],
    },
    usage: i18n.__("commands.general.prefix.usage"),
})
export class PrefixCommand extends BaseCommand {
    @memberReqPerms(["ManageGuild"], i18n.__("commands.general.prefix.noPermission"))
    public async execute(ctx: CommandContext): Promise<void> {
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
