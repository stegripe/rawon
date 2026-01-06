import { ApplicationCommandOptionType, type Message } from "discord.js";
import i18n from "../../config/index.js";
import { BaseCommand } from "../../structures/BaseCommand.js";
import { type CommandContext } from "../../structures/CommandContext.js";
import { type GuildData } from "../../typings/index.js";
import { Command } from "../../utils/decorators/Command.js";
import { inVC, sameVC, validVC } from "../../utils/decorators/MusicUtil.js";
import { createEmbed } from "../../utils/functions/createEmbed.js";
import { filterArgs } from "../../utils/functions/ffmpegArgs.js";
import { i18n__, i18n__mf } from "../../utils/functions/i18n.js";

type FilterSubCmd = "disable" | "enable" | "status";

const slashFilterChoices = Object.keys(filterArgs).map((x) => ({ name: x, value: x }));

@Command({
    aliases: [],
    description: i18n.__("commands.music.filter.description"),
    name: "filter",
    slash: {
        options: [
            {
                description: i18n.__mf("commands.music.filter.slashStateDescription", {
                    state: "enable",
                }),
                name: "enable",
                options: [
                    {
                        choices: slashFilterChoices,
                        description: i18n.__mf(
                            "commands.music.filter.slashStateFilterDescription",
                            {
                                state: "enable",
                            },
                        ),
                        name: "filter",
                        required: true,
                        type: ApplicationCommandOptionType.String,
                    },
                ],
                type: ApplicationCommandOptionType.Subcommand,
            },
            {
                description: i18n.__mf("commands.music.filter.slashStateDescription", {
                    state: "disable",
                }),
                name: "disable",
                options: [
                    {
                        choices: slashFilterChoices,
                        description: i18n.__("commands.music.filter.slashStateFilterDescription", {
                            state: "disable",
                        }),
                        name: "filter",
                        required: true,
                        type: ApplicationCommandOptionType.String,
                    },
                ],
                type: ApplicationCommandOptionType.Subcommand,
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
                        type: ApplicationCommandOptionType.String,
                    },
                ],
                type: ApplicationCommandOptionType.Subcommand,
            },
        ],
    },
    usage: i18n.__("commands.music.filter.usage"),
})
export class FilterCommand extends BaseCommand {
    @inVC
    @validVC
    @sameVC
    public async execute(ctx: CommandContext): Promise<Message | undefined> {
        const __ = i18n__(this.client, ctx.guild);
        const __mf = i18n__mf(this.client, ctx.guild);

        const mode: Record<string, FilterSubCmd> = {
            on: "enable",
            off: "disable",
            enable: "enable",
            disable: "disable",
            stats: "status",
            status: "status",
        };
        const subcmd = mode[
            (
                ctx.options?.getSubcommand() ?? (ctx.args[0] as string | undefined)
            )?.toLowerCase() as unknown as string
        ] as FilterSubCmd | undefined;
        const filter = (
            ctx.options?.getString("filter") ?? (ctx.args[subcmd ? 1 : 0] as string | undefined)
        )?.toLowerCase() as keyof typeof filterArgs;
        if (subcmd === "enable" || subcmd === "disable") {
            if (!filterArgs[filter]) {
                return ctx.reply({
                    embeds: [createEmbed("error", __("commands.music.filter.specifyFilter"), true)],
                });
            }

            const queue = ctx.guild?.queue;
            const newState = subcmd === "enable";

            if (queue) {
                // Queue exists - use the queue's setFilter method
                const appliedWithSeek = queue.setFilter(filter, newState);

                if (appliedWithSeek) {
                    // Filter applied with smooth seek transition (fully cached song)
                    return ctx.reply({
                        embeds: [
                            createEmbed(
                                "info",
                                __mf("commands.music.filter.filterSet", {
                                    filter: `\`${filter}\``,
                                    state: `\`${newState ? "Enabled" : "Disabled"}\``,
                                }),
                            ),
                        ],
                    });
                }
                // Filter applied but song restarted from beginning (not fully cached)
                return ctx.reply({
                    embeds: [
                        createEmbed(
                            "info",
                            __mf("commands.music.filter.filterSetRestarted", {
                                filter: `\`${filter}\``,
                                state: `\`${newState ? "Enabled" : "Disabled"}\``,
                            }),
                        ),
                    ],
                });
            }
            // No queue exists - save filter state directly to guild player state
            await this.saveFilterWithoutQueue(ctx, filter, newState);
            return ctx.reply({
                embeds: [
                    createEmbed(
                        "info",
                        __mf("commands.music.filter.filterSetNoQueue", {
                            filter: `\`${filter}\``,
                            state: `\`${newState ? "Enabled" : "Disabled"}\``,
                        }),
                    ),
                ],
            });
        }

        // Get current filters (from queue if exists, otherwise from saved state)
        const currentFilters = await this.getCurrentFilters(ctx);

        if (filterArgs[filter]) {
            const isEnabled = currentFilters[filter] === true;
            return ctx.reply({
                embeds: [
                    createEmbed(
                        "info",
                        __mf("commands.music.filter.currentState", {
                            filter: `\`${filter}\``,
                            state: `\`${isEnabled ? "Enabled" : "Disabled"}\``,
                        }),
                    ).setFooter({
                        text: `• ${__mf("commands.music.filter.embedFooter", {
                            filter,
                            opstate: isEnabled ? "disable" : "enable",
                            prefix: ctx.isCommand() ? "/" : this.client.config.mainPrefix,
                        })}`,
                    }),
                ],
            });
        }

        const keys = Object.keys(filterArgs) as (keyof typeof filterArgs)[];
        return ctx.reply({
            embeds: [
                createEmbed("info").addFields(
                    {
                        name: __("commands.music.filter.availableFilters"),
                        value:
                            keys
                                .filter((x) => currentFilters[x] !== true)
                                .map((x) => `\`${x}\``)
                                .join("\n") || "-",
                        inline: true,
                    },
                    {
                        name: __("commands.music.filter.currentlyUsedFilters"),
                        value:
                            keys
                                .filter((x) => currentFilters[x] === true)
                                .map((x) => `\`${x}\``)
                                .join("\n") || "-",
                        inline: true,
                    },
                ),
            ],
        });
    }

    /**
     * Save filter state when no queue exists
     */
    private async saveFilterWithoutQueue(
        ctx: CommandContext,
        filter: keyof typeof filterArgs,
        state: boolean,
    ): Promise<void> {
        const guildId = ctx.guild?.id;
        if (!guildId) {
            return;
        }

        const botId = this.client.user?.id ?? "unknown";

        // Get existing player state or create new one
        let playerState: NonNullable<GuildData["playerState"]>;

        if (this.client.config.isMultiBot) {
            if (
                "getPlayerState" in this.client.data &&
                typeof this.client.data.getPlayerState === "function"
            ) {
                const existingState = (this.client.data as any).getPlayerState(guildId, botId);
                playerState = existingState ?? this.getDefaultPlayerState();
            } else {
                playerState = this.getDefaultPlayerState();
            }
        } else {
            const existingState = this.client.data.data?.[guildId]?.playerState;
            playerState = existingState ?? this.getDefaultPlayerState();
        }

        // Update the filter
        playerState.filters[filter] = state;

        // Save the updated state
        if (this.client.config.isMultiBot) {
            if (
                "savePlayerState" in this.client.data &&
                typeof this.client.data.savePlayerState === "function"
            ) {
                await (this.client.data as any).savePlayerState(guildId, botId, playerState);
            }
        } else {
            const currentData = this.client.data.data ?? {};
            const guildData = currentData[guildId] ?? {};
            guildData.playerState = playerState;

            await this.client.data.save(() => ({
                ...currentData,
                [guildId]: guildData,
            }));
        }
    }

    /**
     * Get current filter state from queue or saved player state
     */
    private async getCurrentFilters(
        ctx: CommandContext,
    ): Promise<Partial<Record<keyof typeof filterArgs, boolean>>> {
        // If queue exists, use queue filters
        if (ctx.guild?.queue) {
            return ctx.guild.queue.filters;
        }

        // Otherwise, get from saved state
        const guildId = ctx.guild?.id;
        if (!guildId) {
            return {};
        }

        const botId = this.client.user?.id ?? "unknown";

        if (this.client.config.isMultiBot) {
            if (
                "getPlayerState" in this.client.data &&
                typeof this.client.data.getPlayerState === "function"
            ) {
                const state = (this.client.data as any).getPlayerState(guildId, botId);
                return (state?.filters ?? {}) as Partial<Record<keyof typeof filterArgs, boolean>>;
            }
        } else {
            const state = this.client.data.data?.[guildId]?.playerState;
            return (state?.filters ?? {}) as Partial<Record<keyof typeof filterArgs, boolean>>;
        }

        return {};
    }

    /**
     * Get default player state
     */
    private getDefaultPlayerState(): NonNullable<GuildData["playerState"]> {
        return {
            loopMode: "OFF",
            shuffle: false,
            volume: 100,
            filters: {},
        };
    }
}
