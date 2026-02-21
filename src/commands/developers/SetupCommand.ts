/** biome-ignore-all lint/style/useNamingConvention: disable naming convention rule for this file */
import { ApplyOptions } from "@sapphire/decorators";
import { type Command } from "@sapphire/framework";
import { type CommandContext, ContextCommand } from "@stegripe/command-context";
import { PermissionFlagsBits, type SlashCommandBuilder } from "discord.js";
import i18n from "../../config/index.js";
import { type CommandContext as LocalCommandContext } from "../../structures/CommandContext.js";
import { type Rawon } from "../../structures/Rawon.js";
import { createEmbed } from "../../utils/functions/createEmbed.js";
import { i18n__ } from "../../utils/functions/i18n.js";
import { BOT_SETTINGS_DEFAULTS } from "../../utils/structures/SQLiteDataManager.js";

@ApplyOptions<Command.Options>({
    name: "setup",
    aliases: ["config", "settings"],
    description: i18n.__("commands.developers.setup.description"),
    detailedDescription: { usage: i18n.__("commands.developers.setup.usage") },
    devOnly: true,
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
            .setName(opts.name ?? "setup")
            .setDescription(opts.description ?? i18n.__("commands.developers.setup.description"))
            .addSubcommand((sub) =>
                sub.setName("view").setDescription("List available settings and usage"),
            )
            .addSubcommand((sub) =>
                sub
                    .setName("embedcolor")
                    .setDescription("Set the embed color")
                    .addStringOption((opt) =>
                        opt
                            .setName("color")
                            .setDescription("Hex color code (e.g., FF5733) or 'reset'")
                            .setRequired(true),
                    ),
            )
            .addSubcommand((sub) =>
                sub
                    .setName("yesemoji")
                    .setDescription("Set the success emoji")
                    .addStringOption((opt) =>
                        opt
                            .setName("emoji")
                            .setDescription("The emoji to use, or 'reset'")
                            .setRequired(true),
                    ),
            )
            .addSubcommand((sub) =>
                sub
                    .setName("noemoji")
                    .setDescription("Set the error emoji")
                    .addStringOption((opt) =>
                        opt
                            .setName("emoji")
                            .setDescription("The emoji to use, or 'reset'")
                            .setRequired(true),
                    ),
            )
            .addSubcommand((sub) =>
                sub
                    .setName("altprefix")
                    .setDescription("Set alternative prefixes")
                    .addStringOption((opt) =>
                        opt
                            .setName("prefixes")
                            .setDescription("Comma-separated prefixes, or 'reset'")
                            .setRequired(true),
                    ),
            )
            .addSubcommand((sub) =>
                sub
                    .setName("splash")
                    .setDescription("Set the request channel splash image")
                    .addStringOption((opt) =>
                        opt
                            .setName("url")
                            .setDescription("Image URL, or 'reset'")
                            .setRequired(true),
                    ),
            )
            .addSubcommand((sub) =>
                sub
                    .setName("defaultvolume")
                    .setDescription("Set the default playback volume")
                    .addIntegerOption((opt) =>
                        opt
                            .setName("volume")
                            .setDescription("Volume 1-200, or 0 to reset")
                            .setMinValue(0)
                            .setMaxValue(200)
                            .setRequired(true),
                    ),
            )
            .addSubcommand((sub) =>
                sub
                    .setName("selectiontype")
                    .setDescription("Set music selection type")
                    .addStringOption((opt) =>
                        opt
                            .setName("type")
                            .setDescription("'message', 'selectmenu', or 'reset'")
                            .addChoices(
                                { name: "Message", value: "message" },
                                { name: "Select Menu", value: "selectmenu" },
                                { name: "Reset", value: "reset" },
                            )
                            .setRequired(true),
                    ),
            )
            .addSubcommand((sub) =>
                sub
                    .setName("audiocache")
                    .setDescription("Enable or disable audio caching")
                    .addBooleanOption((opt) =>
                        opt
                            .setName("enabled")
                            .setDescription("Enable or disable")
                            .setRequired(true),
                    ),
            )
            .addSubcommand((sub) =>
                sub.setName("reset").setDescription("Reset all settings to defaults"),
            ) as SlashCommandBuilder;
    },
})
export class SetupCommand extends ContextCommand {
    private getClient(ctx: CommandContext): Rawon {
        return ctx.client as Rawon;
    }

    public async contextRun(ctx: CommandContext): Promise<void> {
        const localCtx = ctx as unknown as LocalCommandContext;
        const client = this.getClient(ctx);
        const __ = i18n__(client, ctx.guild);

        const subCommand = localCtx.options?.getSubcommand(false);
        const setting = subCommand ?? localCtx.args[0]?.toLowerCase();

        if (!setting) {
            await this.showSettings(ctx, __);
            return;
        }
        if (setting === "view") {
            await this.showAvailableSettings(ctx, client, __);
            return;
        }

        switch (setting) {
            case "embedcolor":
                await this.setupEmbedColor(ctx, client, localCtx, __);
                break;
            case "yesemoji":
                await this.setupYesEmoji(ctx, client, localCtx, __);
                break;
            case "noemoji":
                await this.setupNoEmoji(ctx, client, localCtx, __);
                break;
            case "altprefix":
                await this.setupAltPrefix(ctx, client, localCtx, __);
                break;
            case "splash":
                await this.setupSplash(ctx, client, localCtx, __);
                break;
            case "defaultvolume":
                await this.setupDefaultVolume(ctx, client, localCtx, __);
                break;
            case "selectiontype":
                await this.setupSelectionType(ctx, client, localCtx, __);
                break;
            case "audiocache":
                await this.setupAudioCache(ctx, client, localCtx, __);
                break;
            case "reset":
                await this.resetAll(ctx, client, __);
                break;
            default:
                await ctx.reply({
                    embeds: [
                        createEmbed(
                            "warn",
                            __("commands.developers.setup.unknownSetting").replace(
                                "{command}",
                                `\`${client.config.mainPrefix}setup view\``,
                            ),
                        ),
                    ],
                });
        }
    }

    private async showAvailableSettings(
        ctx: CommandContext,
        client: Rawon,
        __: (key: string) => string,
    ): Promise<void> {
        const prefix = client.config.mainPrefix;
        const settings = [
            {
                param: "embedcolor",
                desc: "Set embed color",
                usage: `${prefix}setup embedcolor <hex|reset>`,
            },
            {
                param: "yesemoji",
                desc: "Set success emoji",
                usage: `${prefix}setup yesemoji <emoji|reset>`,
            },
            {
                param: "noemoji",
                desc: "Set error emoji",
                usage: `${prefix}setup noemoji <emoji|reset>`,
            },
            {
                param: "splash",
                desc: "Set request channel splash image",
                usage: `${prefix}setup splash <url|reset>`,
            },
            {
                param: "altprefix",
                desc: "Set alternative prefixes",
                usage: `${prefix}setup altprefix <prefixes|reset>`,
            },
            {
                param: "defaultvolume",
                desc: "Set default playback volume",
                usage: `${prefix}setup defaultvolume <1-200|0=reset>`,
            },
            {
                param: "selectiontype",
                desc: "Set music selection type",
                usage: `${prefix}setup selectiontype <message|selectmenu|reset>`,
            },
            {
                param: "audiocache",
                desc: "Enable or disable audio caching",
                usage: `${prefix}setup audiocache <enable|disable>`,
            },
            {
                param: "reset",
                desc: "Reset all settings to defaults",
                usage: `${prefix}setup reset`,
            },
        ];

        const value = settings
            .map((s) => `**${s.param}** — ${s.desc}\n\`${s.usage}\``)
            .join("\n\n");

        const embed = createEmbed("info")
            .setAuthor({
                name: `${__("commands.developers.setup.embedTitle")} — Available Settings`,
            })
            .setDescription(value)
            .setFooter({
                text: ctx.author.tag,
                iconURL: ctx.author.displayAvatarURL(),
            })
            .setTimestamp();

        await ctx.reply({ embeds: [embed] });
    }

    private async showSettings(ctx: CommandContext, __: (key: string) => string): Promise<void> {
        const bs = this.container.data.botSettings;

        const isDefault = (val: unknown, defaultVal: unknown): boolean =>
            JSON.stringify(val) === JSON.stringify(defaultVal);

        const embed = createEmbed("info")
            .setAuthor({ name: __("commands.developers.setup.embedTitle") })
            .addFields(
                {
                    name: "🎨 Embed Color",
                    value: isDefault(bs.embedColor, BOT_SETTINGS_DEFAULTS.embedColor)
                        ? "`Default`"
                        : `\`#${bs.embedColor}\``,
                    inline: true,
                },
                {
                    name: "✅ Yes Emoji",
                    value: isDefault(bs.yesEmoji, BOT_SETTINGS_DEFAULTS.yesEmoji)
                        ? "`Default`"
                        : bs.yesEmoji,
                    inline: true,
                },
                {
                    name: "❌ No Emoji",
                    value: isDefault(bs.noEmoji, BOT_SETTINGS_DEFAULTS.noEmoji)
                        ? "`Default`"
                        : bs.noEmoji,
                    inline: true,
                },
                {
                    name: "🖼️ Splash Image",
                    value: isDefault(
                        bs.requestChannelSplash,
                        BOT_SETTINGS_DEFAULTS.requestChannelSplash,
                    )
                        ? "`Default`"
                        : "`Custom`",
                    inline: true,
                },
                {
                    name: "📝 Alt Prefixes",
                    value: isDefault(bs.altPrefix, BOT_SETTINGS_DEFAULTS.altPrefix)
                        ? "`Default`"
                        : bs.altPrefix.map((p) => `\`${p}\``).join(", "),
                    inline: true,
                },
                {
                    name: "🔊 Default Volume",
                    value: isDefault(bs.defaultVolume, BOT_SETTINGS_DEFAULTS.defaultVolume)
                        ? "`Default`"
                        : `\`${bs.defaultVolume}%\``,
                    inline: true,
                },
                {
                    name: "📋 Selection Type",
                    value: isDefault(
                        bs.musicSelectionType,
                        BOT_SETTINGS_DEFAULTS.musicSelectionType,
                    )
                        ? "`Default`"
                        : `\`${bs.musicSelectionType}\``,
                    inline: true,
                },
                {
                    name: "💾 Audio Cache",
                    value: isDefault(bs.enableAudioCache, BOT_SETTINGS_DEFAULTS.enableAudioCache)
                        ? "`Default`"
                        : bs.enableAudioCache
                          ? "`Enabled`"
                          : "`Disabled`",
                    inline: true,
                },
            )
            .setFooter({
                text: ctx.author.tag,
                iconURL: ctx.author.displayAvatarURL(),
            })
            .setTimestamp();

        await ctx.reply({ embeds: [embed] });
    }

    private async setupEmbedColor(
        ctx: CommandContext,
        client: Rawon,
        localCtx: LocalCommandContext,
        __: (key: string) => string,
    ): Promise<void> {
        const value = localCtx.options?.getString("color") ?? localCtx.args[1];
        if (!value) {
            await ctx.reply({
                embeds: [createEmbed("warn", __("commands.developers.setup.embedColor.invalid"))],
            });
            return;
        }

        if (value.toLowerCase() === "reset") {
            await client.data.setBotSetting("embed_color", null);
            await ctx.reply({
                embeds: [
                    createEmbed("success", __("commands.developers.setup.embedColor.reset"), true),
                ],
            });
            return;
        }

        const normalized = value.replace(/^#/, "").toUpperCase();
        if (!/^[0-9A-F]{6}$/i.test(normalized)) {
            await ctx.reply({
                embeds: [createEmbed("warn", __("commands.developers.setup.embedColor.invalid"))],
            });
            return;
        }

        await client.data.setBotSetting("embed_color", normalized);
        await ctx.reply({
            embeds: [
                createEmbed(
                    "success",
                    __("commands.developers.setup.embedColor.set").replace(
                        "{color}",
                        `\`#${normalized}\``,
                    ),
                    true,
                ),
            ],
        });
    }

    private async setupYesEmoji(
        ctx: CommandContext,
        client: Rawon,
        localCtx: LocalCommandContext,
        __: (key: string) => string,
    ): Promise<void> {
        const value = localCtx.options?.getString("emoji") ?? localCtx.args[1];
        if (!value) {
            await ctx.reply({
                embeds: [createEmbed("warn", "Please provide an emoji or `reset`.")],
            });
            return;
        }

        if (value.toLowerCase() === "reset") {
            await client.data.setBotSetting("yes_emoji", null);
            await ctx.reply({
                embeds: [
                    createEmbed("success", __("commands.developers.setup.yesEmoji.reset"), true),
                ],
            });
            return;
        }

        await client.data.setBotSetting("yes_emoji", value);
        await ctx.reply({
            embeds: [
                createEmbed(
                    "success",
                    __("commands.developers.setup.yesEmoji.set").replace("{emoji}", value),
                    true,
                ),
            ],
        });
    }

    private async setupNoEmoji(
        ctx: CommandContext,
        client: Rawon,
        localCtx: LocalCommandContext,
        __: (key: string) => string,
    ): Promise<void> {
        const value = localCtx.options?.getString("emoji") ?? localCtx.args[1];
        if (!value) {
            await ctx.reply({
                embeds: [createEmbed("warn", "Please provide an emoji or `reset`.")],
            });
            return;
        }

        if (value.toLowerCase() === "reset") {
            await client.data.setBotSetting("no_emoji", null);
            await ctx.reply({
                embeds: [
                    createEmbed("success", __("commands.developers.setup.noEmoji.reset"), true),
                ],
            });
            return;
        }

        await client.data.setBotSetting("no_emoji", value);
        await ctx.reply({
            embeds: [
                createEmbed(
                    "success",
                    __("commands.developers.setup.noEmoji.set").replace("{emoji}", value),
                    true,
                ),
            ],
        });
    }

    private async setupAltPrefix(
        ctx: CommandContext,
        client: Rawon,
        localCtx: LocalCommandContext,
        __: (key: string) => string,
    ): Promise<void> {
        const value = localCtx.options?.getString("prefixes") ?? localCtx.args.slice(1).join(" ");
        if (!value) {
            await ctx.reply({
                embeds: [createEmbed("warn", __("commands.developers.setup.altPrefix.invalid"))],
            });
            return;
        }

        if (value.toLowerCase() === "reset") {
            await client.data.setBotSetting("alt_prefix", null);
            await ctx.reply({
                embeds: [
                    createEmbed("success", __("commands.developers.setup.altPrefix.reset"), true),
                ],
            });
            return;
        }

        const prefixes = value
            .split(",")
            .map((p) => p.trim())
            .filter(Boolean);
        if (prefixes.length === 0) {
            await ctx.reply({
                embeds: [createEmbed("warn", __("commands.developers.setup.altPrefix.invalid"))],
            });
            return;
        }

        await client.data.setBotSetting("alt_prefix", prefixes.join(","));
        await ctx.reply({
            embeds: [
                createEmbed(
                    "success",
                    __("commands.developers.setup.altPrefix.set").replace(
                        "{prefixes}",
                        prefixes.map((p) => `\`${p}\``).join(", "),
                    ),
                    true,
                ),
            ],
        });
    }

    private async setupSplash(
        ctx: CommandContext,
        client: Rawon,
        localCtx: LocalCommandContext,
        __: (key: string) => string,
    ): Promise<void> {
        const value = localCtx.options?.getString("url") ?? localCtx.args[1];
        if (!value) {
            await ctx.reply({
                embeds: [createEmbed("warn", __("commands.developers.setup.splash.invalid"))],
            });
            return;
        }

        if (value.toLowerCase() === "reset") {
            await client.data.setBotSetting("request_channel_splash", null);
            await ctx.reply({
                embeds: [
                    createEmbed("success", __("commands.developers.setup.splash.reset"), true),
                ],
            });
            return;
        }

        if (!/^https?:\/\/.+/i.test(value)) {
            await ctx.reply({
                embeds: [createEmbed("warn", __("commands.developers.setup.splash.invalid"))],
            });
            return;
        }

        await client.data.setBotSetting("request_channel_splash", value);
        await ctx.reply({
            embeds: [createEmbed("success", __("commands.developers.setup.splash.set"), true)],
        });
    }

    private async setupDefaultVolume(
        ctx: CommandContext,
        client: Rawon,
        localCtx: LocalCommandContext,
        __: (key: string) => string,
    ): Promise<void> {
        const raw = localCtx.options?.getInteger("volume") ?? Number(localCtx.args[1]);
        if (raw === undefined || raw === null || Number.isNaN(raw)) {
            await ctx.reply({
                embeds: [
                    createEmbed("warn", __("commands.developers.setup.defaultVolume.invalid")),
                ],
            });
            return;
        }

        if (raw === 0) {
            await client.data.setBotSetting("default_volume", null);
            await ctx.reply({
                embeds: [
                    createEmbed(
                        "success",
                        __("commands.developers.setup.defaultVolume.reset"),
                        true,
                    ),
                ],
            });
            return;
        }

        if (raw < 1 || raw > 200) {
            await ctx.reply({
                embeds: [
                    createEmbed("warn", __("commands.developers.setup.defaultVolume.invalid")),
                ],
            });
            return;
        }

        await client.data.setBotSetting("default_volume", raw);
        await ctx.reply({
            embeds: [
                createEmbed(
                    "success",
                    __("commands.developers.setup.defaultVolume.set").replace(
                        "{volume}",
                        `\`${raw}%\``,
                    ),
                    true,
                ),
            ],
        });
    }

    private async setupSelectionType(
        ctx: CommandContext,
        client: Rawon,
        localCtx: LocalCommandContext,
        __: (key: string) => string,
    ): Promise<void> {
        const value = (localCtx.options?.getString("type") ?? localCtx.args[1])?.toLowerCase();
        if (!value) {
            await ctx.reply({
                embeds: [
                    createEmbed("warn", __("commands.developers.setup.selectionType.invalid")),
                ],
            });
            return;
        }

        if (value === "reset") {
            await client.data.setBotSetting("music_selection_type", null);
            await ctx.reply({
                embeds: [
                    createEmbed(
                        "success",
                        __("commands.developers.setup.selectionType.reset"),
                        true,
                    ),
                ],
            });
            return;
        }

        if (value !== "message" && value !== "selectmenu") {
            await ctx.reply({
                embeds: [
                    createEmbed("warn", __("commands.developers.setup.selectionType.invalid")),
                ],
            });
            return;
        }

        await client.data.setBotSetting("music_selection_type", value);
        await ctx.reply({
            embeds: [
                createEmbed(
                    "success",
                    __("commands.developers.setup.selectionType.set").replace(
                        "{type}",
                        `\`${value}\``,
                    ),
                    true,
                ),
            ],
        });
    }

    private async setupAudioCache(
        ctx: CommandContext,
        client: Rawon,
        localCtx: LocalCommandContext,
        __: (key: string) => string,
    ): Promise<void> {
        let enabled: boolean;

        if (localCtx.options) {
            enabled = localCtx.options.getBoolean("enabled") ?? true;
        } else {
            const val = localCtx.args[1]?.toLowerCase();
            enabled = val === "enable" || val === "true" || val === "yes" || val === "on";
        }

        await client.data.setBotSetting("enable_audio_cache", enabled ? 1 : 0);

        const stateStr = enabled
            ? __("commands.developers.setup.audioCache.enabled")
            : __("commands.developers.setup.audioCache.disabled");

        await ctx.reply({
            embeds: [
                createEmbed(
                    "success",
                    __("commands.developers.setup.audioCache.set").replace(
                        "{state}",
                        `\`${stateStr}\``,
                    ),
                    true,
                ),
            ],
        });
    }

    private async resetAll(
        ctx: CommandContext,
        client: Rawon,
        __: (key: string) => string,
    ): Promise<void> {
        const keys = [
            "embed_color",
            "yes_emoji",
            "no_emoji",
            "alt_prefix",
            "request_channel_splash",
            "default_volume",
            "music_selection_type",
            "enable_audio_cache",
        ];

        for (const key of keys) {
            await client.data.setBotSetting(key, null);
        }

        await ctx.reply({
            embeds: [createEmbed("success", __("commands.developers.setup.resetAll"), true)],
        });
    }
}
