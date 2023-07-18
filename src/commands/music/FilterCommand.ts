import { inVC, sameVC, validVC } from "../../utils/decorators/MusicUtil.js";
import { CommandContext } from "../../structures/CommandContext.js";
import { createEmbed } from "../../utils/functions/createEmbed.js";
import { filterArgs } from "../../utils/functions/ffmpegArgs.js";
import { BaseCommand } from "../../structures/BaseCommand.js";
import { Command } from "../../utils/decorators/Command.js";
import i18n from "../../config/index.js";
import { ApplicationCommandOptionType, Message } from "discord.js";

type FilterSubCmd = "disable" | "enable" | "status";

const slashFilterChoices = Object.keys(filterArgs).map(x => ({ name: x, value: x }));

@Command({
    aliases: [],
    description: i18n.__("commands.music.filter.description"),
    name: "filter",
    slash: {
        options: [
            {
                description: i18n.__mf("commands.music.filter.slashStateDescription", {
                    state: "enable"
                }),
                name: "enable",
                options: [
                    {
                        choices: slashFilterChoices,
                        description: i18n.__mf("commands.music.filter.slashStateFilterDescription", {
                            state: "enable"
                        }),
                        name: "filter",
                        required: true,
                        type: ApplicationCommandOptionType.String
                    }
                ],
                type: ApplicationCommandOptionType.Subcommand
            },
            {
                description: i18n.__mf("commands.music.filter.slashStateDescription", {
                    state: "disable"
                }),
                name: "disable",
                options: [
                    {
                        choices: slashFilterChoices,
                        description: i18n.__("commands.music.filter.slashStateFilterDescription", {
                            state: "disable"
                        }),
                        name: "filter",
                        required: true,
                        type: ApplicationCommandOptionType.String
                    }
                ],
                type: ApplicationCommandOptionType.Subcommand
            },
            {
                description: i18n.__("commands.music.filter.slashStatusDescription"),
                name: "status",
                options: [
                    {
                        choices: slashFilterChoices,
                        description: i18n.__("commands.music.filter.slashStatusFilterDescription"),
                        name: "filter",
                        required: false,
                        type: ApplicationCommandOptionType.String
                    }
                ],
                type: ApplicationCommandOptionType.Subcommand
            }
        ]
    },
    usage: "{prefix}filter"
})
export class FilterCommand extends BaseCommand {
    @inVC
    @validVC
    @sameVC
    public execute(ctx: CommandContext): Promise<Message> {
        const mode: Record<string, FilterSubCmd> = {
            on: "enable",
            off: "disable",
            enable: "enable",
            disable: "disable",
            stats: "status",
            status: "status"
        }
        const subcmd = mode[
            (
                ctx.options?.getSubcommand() ??
                ctx.args[0] as string | undefined
            )?.toLowerCase() as unknown as string
        ] as FilterSubCmd | undefined;
        const filter = (ctx.options?.getString("filter") ?? ctx.args[subcmd ? 1 : 0] as string | undefined)?.toLowerCase() as keyof typeof filterArgs;
        if (subcmd === "enable" || subcmd === "disable") {
            if (!filterArgs[filter]) {
                return ctx.reply({
                    embeds: [createEmbed("error", i18n.__("commands.music.filter.specifyFilter"))]
                });
            }

            ctx.guild?.queue?.setFilter(filter, subcmd === "enable");
            return ctx.reply({
                embeds: [
                    createEmbed("info", i18n.__mf("commands.music.filter.filterSet", {
                        filter,
                        state: subcmd === "enable" ? "ENABLED" : "DISABLED"
                    }))
                ]
            });
        }

        if (filterArgs[filter]) {
            return ctx.reply({
                embeds: [
                    createEmbed("info", i18n.__mf("commands.music.filter.currentState", {
                        filter,
                        state: ctx.guild?.queue?.filters[filter] ? "ENABLED" : "DISABLED"
                    }))
                        .setFooter({
                            text: i18n.__mf("commands.music.filter.embedFooter", {
                                filter,
                                opstate: ctx.guild?.queue?.filters[filter] ? "disable" : "enable",
                                prefix: ctx.isCommand() ? "/" : this.client.config.mainPrefix
                            })
                        })
                ]
            });
        }

        const keys = Object.keys(filterArgs) as (keyof typeof filterArgs)[]
        return ctx.reply({
            embeds: [
                createEmbed("info")
                    .addFields(
                        {
                            name: i18n.__("commands.music.filter.availableFilters"),
                            value: keys
                                .filter(x => !ctx.guild?.queue?.filters[x])
                                .map(x => `\`${x}\``)
                                .join("\n") || "-",
                            inline: true
                        },
                        {
                            name: i18n.__("commands.music.filter.currentlyUsedFilters"),
                            value: keys
                                .filter(x => ctx.guild?.queue?.filters[x])
                                .map(x => `\`${x}\``)
                                .join("\n") || "-",
                            inline: true
                        }
                    )
            ]
        })
    }
}
