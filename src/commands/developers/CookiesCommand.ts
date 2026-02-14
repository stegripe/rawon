/** biome-ignore-all lint/style/useNamingConvention: disable naming convention rule for this file */
import { ApplyOptions } from "@sapphire/decorators";
import { type Command } from "@sapphire/framework";
import { type CommandContext, ContextCommand } from "@stegripe/command-context";
import { type Message, PermissionFlagsBits, type SlashCommandBuilder } from "discord.js";
import i18n from "../../config/index.js";
import { type CommandContext as LocalCommandContext } from "../../structures/CommandContext.js";
import { type Rawon } from "../../structures/Rawon.js";
import { createEmbed } from "../../utils/functions/createEmbed.js";
import { i18n__, i18n__mf } from "../../utils/functions/i18n.js";

@ApplyOptions<Command.Options>({
    name: "cookies",
    aliases: ["cookie", "ck"],
    description: i18n.__("commands.developers.cookies.description"),
    detailedDescription: { usage: i18n.__("commands.developers.cookies.usage") },
    preconditions: ["DevOnly"],
    cooldownDelay: 3000,
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
            .setName(opts.name ?? "cookies")
            .setDescription(opts.description ?? i18n.__("commands.developers.cookies.description"))
            .addSubcommand((sub) =>
                sub
                    .setName("status")
                    .setDescription(i18n.__("commands.developers.cookies.slashStatusDescription")),
            )
            .addSubcommand((sub) =>
                sub
                    .setName("reset")
                    .setDescription(i18n.__("commands.developers.cookies.slashResetDescription")),
            )
            .addSubcommand((sub) =>
                sub
                    .setName("refresh")
                    .setDescription(i18n.__("commands.developers.cookies.slashRefreshDescription")),
            ) as SlashCommandBuilder;
    },
})
export class CookiesCommand extends ContextCommand {
    private getClient(ctx: CommandContext): Rawon {
        return ctx.client as Rawon;
    }

    public async contextRun(ctx: CommandContext): Promise<Message | undefined> {
        const localCtx = ctx as unknown as LocalCommandContext;
        const client = this.getClient(ctx);
        const __ = i18n__(client, localCtx.guild);
        const __mf = i18n__mf(client, localCtx.guild);
        const subcommand = localCtx.options?.getSubcommand() ?? localCtx.args[0]?.toLowerCase();

        if (!subcommand) {
            return this.handleStatus(client, ctx, __, __mf);
        }

        switch (subcommand) {
            case "status":
            case "list":
            case "info":
                return this.handleStatus(client, ctx, __, __mf);
            case "reset":
                return this.handleReset(client, ctx, __);
            case "refresh":
                return this.handleRefresh(client, ctx, __, __mf);
            default:
                return ctx.reply({
                    embeds: [
                        createEmbed(
                            "warn",
                            __mf("commands.developers.cookies.invalidSubcommand", {
                                prefix: client.config.mainPrefix,
                            }),
                        ),
                    ],
                });
        }
    }

    private async handleStatus(
        client: Rawon,
        ctx: CommandContext,
        __: ReturnType<typeof i18n__>,
        __mf: ReturnType<typeof i18n__mf>,
    ): Promise<Message | undefined> {
        const cookieInfo = client.cookies.getCookieInfo();
        const sessionInfo = client.cookies.getLoginSessionInfo();
        const botDetection = client.cookies.getBotDetectionStats();

        let cookieEmoji: string;
        let cookieStatusText: string;

        switch (cookieInfo.status) {
            case "active":
                cookieEmoji = "🟢";
                cookieStatusText = __("commands.developers.cookies.statusActive");
                break;
            case "stale":
                cookieEmoji = "🟡";
                cookieStatusText = __("commands.developers.cookies.statusStale");
                break;
            default:
                cookieEmoji = "🔴";
                cookieStatusText = __("commands.developers.cookies.statusMissing");
                break;
        }

        let loginEmoji: string;
        let loginText: string;

        switch (sessionInfo.status) {
            case "logged_in":
                loginEmoji = "🟢";
                loginText = __("commands.developers.cookies.sessionLoggedIn");
                break;
            case "waiting_for_login":
                loginEmoji = "🟡";
                loginText = __("commands.developers.cookies.sessionWaiting");
                break;
            case "error":
                loginEmoji = "🔴";
                loginText = __mf("commands.developers.cookies.sessionError", {
                    error: sessionInfo.error ?? "Unknown",
                });
                break;
            default:
                loginEmoji = "⚪";
                loginText = __("commands.developers.cookies.sessionIdle");
        }

        const lastRefresh = cookieInfo.lastRefresh
            ? `<t:${Math.floor(cookieInfo.lastRefresh / 1000)}:R>`
            : __("commands.developers.cookies.lastRefreshNever");

        const descriptionLines = [
            `${cookieEmoji} **${__("commands.developers.cookies.cookieFileField")}** - ${cookieStatusText}`,
            `${loginEmoji} **${__("commands.developers.cookies.googleLoginField")}** - ${loginText}`,
        ];

        const embed = createEmbed("info")
            .setTitle(`${__("commands.developers.cookies.listTitle")}`)
            .setDescription(descriptionLines.join("\n"));

        const sizeText =
            cookieInfo.size > 0 ? `\`${(cookieInfo.size / 1024).toFixed(1)} KB\`` : "N/A";
        const browserText = cookieInfo.browserRunning
            ? __("commands.developers.cookies.browserRunning")
            : __("commands.developers.cookies.browserStopped");
        const accountText = sessionInfo.email ?? __("commands.developers.cookies.accountNA");

        const statsValue = [
            `${__("commands.developers.cookies.sizeLabel")}: ${sizeText}`,
            `${__("commands.developers.cookies.lastRefreshLabel")}: ${lastRefresh}`,
            `${__("commands.developers.cookies.browserLabel")}: ${browserText}`,
            `${__("commands.developers.cookies.accountLabel")}: ${accountText}`,
        ].join(" | ");

        embed.addFields([
            {
                name: __("commands.developers.cookies.statsTitle"),
                value: statsValue,
            },
        ]);

        if (botDetection.count > 0) {
            const lastDetection = botDetection.lastDetection
                ? `<t:${Math.floor(botDetection.lastDetection / 1000)}:R>`
                : __("commands.developers.cookies.lastDetectionNone");

            const warningLines = [
                `${__("commands.developers.cookies.detectionsLabel")}: ${botDetection.count}/${botDetection.threshold}`,
                `${__("commands.developers.cookies.lastDetectionLabel")}: ${lastDetection}`,
            ];

            if (botDetection.count >= botDetection.threshold) {
                warningLines.push(
                    __mf("commands.developers.cookies.thresholdReached", {
                        resetCmd: `\`${client.config.mainPrefix}cookies reset\``,
                        refreshCmd: `\`${client.config.mainPrefix}login refresh\``,
                    }),
                );
            }

            embed.addFields([
                {
                    name: `⚠️ ${__("commands.developers.cookies.warningTitle")}`,
                    value: warningLines.join("\n"),
                },
            ]);
        }

        if (client.cookies.areAllCookiesFailed()) {
            embed.addFields([
                {
                    name: `⚠️ ${__("commands.developers.cookies.warningTitle")}`,
                    value: __mf("commands.developers.cookies.allCookiesFailed", {
                        prefix: client.config.mainPrefix,
                    }),
                },
            ]);
        }

        if (cookieInfo.status === "missing" && sessionInfo.status === "idle") {
            embed.addFields([
                {
                    name: __("commands.developers.cookies.gettingStartedField"),
                    value: __mf("commands.developers.cookies.gettingStartedText", {
                        loginCmd: `\`${client.config.mainPrefix}login start\``,
                    }),
                },
            ]);
        }

        return ctx.reply({ embeds: [embed] });
    }

    private async handleReset(
        client: Rawon,
        ctx: CommandContext,
        __: ReturnType<typeof i18n__>,
    ): Promise<Message | undefined> {
        client.cookies.resetFailedStatus();

        return ctx.reply({
            embeds: [createEmbed("success", __("commands.developers.cookies.resetSuccess"), true)],
        });
    }

    private async handleRefresh(
        client: Rawon,
        ctx: CommandContext,
        __: ReturnType<typeof i18n__>,
        __mf: ReturnType<typeof i18n__mf>,
    ): Promise<Message | undefined> {
        const loginManager = client.cookies.loginManager;

        if (!loginManager.isBrowserRunning()) {
            return ctx.reply({
                embeds: [
                    createEmbed(
                        "error",
                        __mf("commands.developers.cookies.refreshNoBrowser", {
                            loginCmd: `\`${client.config.mainPrefix}login start\``,
                        }),
                        true,
                    ),
                ],
            });
        }

        const msg = await ctx.reply({
            embeds: [createEmbed("info", __("commands.developers.cookies.refreshing"))],
        });

        try {
            await loginManager.refreshCookiesNow();
            client.cookies.resetFailedStatus();

            await msg?.edit({
                embeds: [
                    createEmbed("success", __("commands.developers.cookies.refreshSuccess"), true),
                ],
            });
        } catch (err) {
            await msg?.edit({
                embeds: [
                    createEmbed(
                        "error",
                        __mf("commands.developers.cookies.refreshFailed", {
                            error: (err as Error).message,
                        }),
                        true,
                    ),
                ],
            });
        }

        return msg ?? undefined;
    }
}
