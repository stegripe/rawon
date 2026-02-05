/** biome-ignore-all lint/style/useNamingConvention: disable naming convention rule for this file */
import { ApplyOptions } from "@sapphire/decorators";
import { type Command } from "@sapphire/framework";
import { type CommandContext, ContextCommand } from "@stegripe/command-context";
import { type Message, PermissionFlagsBits, type SlashCommandBuilder } from "discord.js";
import i18n from "../../config/index.js";
import { type Rawon } from "../../structures/Rawon.js";
import { type GuildData } from "../../typings/index.js";
import { inVC, sameVC, validVC } from "../../utils/decorators/MusicUtil.js";
import { createEmbed } from "../../utils/functions/createEmbed.js";
import { filterArgs } from "../../utils/functions/ffmpegArgs.js";
import { i18n__, i18n__mf } from "../../utils/functions/i18n.js";

type FilterSubCmd = "disable" | "enable" | "status";

const slashFilterChoices = Object.keys(filterArgs).map((x) => ({ name: x, value: x }));

@ApplyOptions<Command.Options>({
    name: "filter",
    aliases: [],
    description: i18n.__("commands.music.filter.description"),
    detailedDescription: { usage: i18n.__("commands.music.filter.usage") },
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
            .setName(opts.name ?? "filter")
            .setDescription(opts.description ?? "Manage audio filters.")
            .addSubcommand((sub) =>
                sub
                    .setName("enable")
                    .setDescription(
                        i18n.__mf("commands.music.filter.slashStateDescription", {
                            state: "enable",
                        }),
                    )
                    .addStringOption((opt) =>
                        opt
                            .setName("filter")
                            .setDescription(
                                i18n.__mf("commands.music.filter.slashStateFilterDescription", {
                                    state: "enable",
                                }),
                            )
                            .setRequired(true)
                            .addChoices(...slashFilterChoices),
                    ),
            )
            .addSubcommand((sub) =>
                sub
                    .setName("disable")
                    .setDescription(
                        i18n.__mf("commands.music.filter.slashStateDescription", {
                            state: "disable",
                        }),
                    )
                    .addStringOption((opt) =>
                        opt
                            .setName("filter")
                            .setDescription(
                                i18n.__("commands.music.filter.slashStateFilterDescription", {
                                    state: "disable",
                                }),
                            )
                            .setRequired(true)
                            .addChoices(...slashFilterChoices),
                    ),
            )
            .addSubcommand((sub) =>
                sub
                    .setName("status")
                    .setDescription(i18n.__("commands.music.filter.slashStatusDescription"))
                    .addStringOption((opt) =>
                        opt
                            .setName("filter")
                            .setDescription(
                                i18n.__("commands.music.filter.slashStatusFilterDescription"),
                            )
                            .setRequired(false)
                            .addChoices(...slashFilterChoices),
                    ),
            ) as SlashCommandBuilder;
    },
})
export class FilterCommand extends ContextCommand {
    private get client(): Rawon {
        return this.container.client as Rawon;
    }

    @inVC
    @validVC
    @sameVC
    public async contextRun(ctx: CommandContext): Promise<Message | undefined> {
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
                const appliedWithSeek = queue.setFilter(filter, newState);

                if (appliedWithSeek) {
                    return ctx.reply({
                        embeds: [
                            createEmbed(
                                "success",
                                __mf("commands.music.filter.filterSet", {
                                    filter: `**\`${filter}\`**`,
                                    state: `**\`${newState ? __("reusable.enabled") : __("reusable.disabled")}\`**`,
                                }),
                                true,
                            ),
                        ],
                    });
                }
                return ctx.reply({
                    embeds: [
                        createEmbed(
                            "success",
                            __mf("commands.music.filter.filterSet", {
                                filter: `**\`${filter}\`**`,
                                state: `**\`${newState ? __("reusable.enabled") : __("reusable.disabled")}\`**`,
                            }),
                            true,
                        ).setFooter({
                            text: `• ${__("commands.music.filter.filterRestartedFooter")}`,
                        }),
                    ],
                });
            }
            await this.saveFilterWithoutQueue(ctx, filter, newState);
            return ctx.reply({
                embeds: [
                    createEmbed(
                        "success",
                        __mf("commands.music.filter.filterSet", {
                            filter: `**\`${filter}\`**`,
                            state: `**\`${newState ? __("reusable.enabled") : __("reusable.disabled")}\`**`,
                        }),
                        true,
                    ).setFooter({
                        text: `• ${__("commands.music.filter.filterNoQueueFooter")}`,
                    }),
                ],
            });
        }

        const currentFilters = await this.getCurrentFilters(ctx);

        if (filterArgs[filter]) {
            const isEnabled = currentFilters[filter] === true;
            return ctx.reply({
                embeds: [
                    createEmbed(
                        "info",
                        __mf("commands.music.filter.currentState", {
                            filter: `**\`${filter}\`**`,
                            state: `**\`${isEnabled ? __("reusable.enabled") : __("reusable.disabled")}\`**`,
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

        playerState.filters[filter] = state;

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

    private async getCurrentFilters(
        ctx: CommandContext,
    ): Promise<Partial<Record<keyof typeof filterArgs, boolean>>> {
        if (ctx.guild?.queue) {
            return ctx.guild.queue.filters;
        }

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

    private getDefaultPlayerState(): NonNullable<GuildData["playerState"]> {
        return {
            loopMode: "OFF",
            shuffle: false,
            volume: 100,
            filters: {},
        };
    }
}
