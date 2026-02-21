/** biome-ignore-all lint/style/useNamingConvention: disable naming convention rule for this file */
import { setTimeout } from "node:timers";
import { ApplyOptions } from "@sapphire/decorators";
import { type Command } from "@sapphire/framework";
import { type CommandContext, ContextCommand } from "@stegripe/command-context";
import { type Message, PermissionFlagsBits, type SlashCommandBuilder } from "discord.js";
import i18n from "../../config/index.js";
import { type CommandContext as LocalCommandContext } from "../../structures/CommandContext.js";
import { type Rawon } from "../../structures/Rawon.js";
import { createEmbed } from "../../utils/functions/createEmbed.js";
import { getEffectivePrefix } from "../../utils/functions/getEffectivePrefix.js";
import { i18n__, i18n__mf } from "../../utils/functions/i18n.js";

@ApplyOptions<Command.Options>({
    name: "login",
    aliases: ["google-login", "gl"],
    description: i18n.__("commands.developers.login.description"),
    detailedDescription: {
        usage: i18n.__("commands.developers.login.usage"),
    },
    preconditions: ["DevOnly"],
    cooldownDelay: 5000,
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
            .setName(opts.name ?? "login")
            .setDescription(opts.description ?? i18n.__("commands.developers.login.description"))
            .addSubcommand((sub) =>
                sub
                    .setName("start")
                    .setDescription(i18n.__("commands.developers.login.slashStartDescription")),
            )
            .addSubcommand((sub) =>
                sub
                    .setName("status")
                    .setDescription(i18n.__("commands.developers.login.slashStatusDescription")),
            )
            .addSubcommand((sub) =>
                sub
                    .setName("logout")
                    .setDescription(i18n.__("commands.developers.login.slashLogoutDescription")),
            ) as SlashCommandBuilder;
    },
})
export class LoginCommand extends ContextCommand {
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
            const prefix = getEffectivePrefix(client, localCtx.guild?.id ?? null);
            return ctx.reply({
                embeds: [
                    createEmbed(
                        "warn",
                        __mf("commands.developers.login.invalidSubcommand", {
                            loginUsage: `\`${prefix}login <start | status | logout>\``,
                        }),
                    ),
                ],
            });
        }

        switch (subcommand) {
            case "start":
                return this.handleStart(client, ctx, __, __mf, localCtx.guild?.id ?? null);
            case "status":
                return this.handleStatus(client, ctx, __, __mf);
            case "logout":
                return this.handleLogout(client, ctx, __, __mf);
            default: {
                const prefix = getEffectivePrefix(client, localCtx.guild?.id ?? null);
                return ctx.reply({
                    embeds: [
                        createEmbed(
                            "warn",
                            __mf("commands.developers.login.invalidSubcommand", {
                                loginUsage: `\`${prefix}login <start | status | logout>\``,
                            }),
                        ),
                    ],
                });
            }
        }
    }

    private async handleStart(
        client: Rawon,
        ctx: CommandContext,
        __: ReturnType<typeof i18n__>,
        __mf: ReturnType<typeof i18n__mf>,
        guildId: string | null,
    ): Promise<Message | undefined> {
        const loginManager = client.cookies.loginManager;

        if (loginManager.isLoggedIn()) {
            const prefix = getEffectivePrefix(client, guildId);
            return ctx.reply({
                embeds: [
                    createEmbed(
                        "warn",
                        __mf("commands.developers.login.alreadyLoggedIn", {
                            logoutCmd: `\`${prefix}login logout\``,
                        }),
                    ),
                ],
            });
        }

        const statusMsg = await ctx.reply({
            embeds: [createEmbed("info", __("commands.developers.login.launching"))],
        });

        try {
            await loginManager.launchBrowser();

            const loginPromise = loginManager.startLoginSession();

            await new Promise((resolve) => setTimeout(resolve, 1_500));

            const sessionInfo = loginManager.getSessionInfo();
            const timeoutMinutes = Math.floor(loginManager.getLoginTimeoutMs() / 60_000);

            if (sessionInfo.inspectUrl) {
                await statusMsg?.edit({
                    embeds: [
                        createEmbed("info")
                            .setTitle(__("commands.developers.login.sessionTitle"))
                            .setDescription(
                                `${__("commands.developers.login.sessionDescription")}\n\n` +
                                    `${__("commands.developers.login.step1WithUrl")}\n` +
                                    `${__("commands.developers.login.step2WithUrl")}\n` +
                                    `${__("commands.developers.login.step3")}\n` +
                                    `${__mf("commands.developers.login.step4", { url: sessionInfo.inspectUrl })}\n\n` +
                                    __mf("commands.developers.login.timeLimit", {
                                        minutes: `\`${String(timeoutMinutes)}\``,
                                    }),
                            ),
                    ],
                });
            } else {
                const debugUrl = sessionInfo.debugUrl ?? "";
                const port = debugUrl ? new URL(debugUrl).port || "4000" : "4000";

                await statusMsg?.edit({
                    embeds: [
                        createEmbed("info")
                            .setTitle(__("commands.developers.login.sessionTitle"))
                            .setDescription(
                                `${__("commands.developers.login.sessionDescription")}\n\n` +
                                    `${__("commands.developers.login.step1Fallback")}\n` +
                                    `${__mf("commands.developers.login.step2Fallback", { target: `\`localhost:${port}\`` })}\n` +
                                    `${__("commands.developers.login.step3")}\n` +
                                    `${__("commands.developers.login.step4")}\n\n` +
                                    __mf("commands.developers.login.timeLimit", {
                                        minutes: `\`${String(timeoutMinutes)}\``,
                                    }),
                            ),
                    ],
                });
            }

            const loggedIn = await loginPromise;

            if (loggedIn) {
                const finalInfo = loginManager.getSessionInfo();
                const emailSuffix = finalInfo.email
                    ? __mf("commands.developers.login.loginSuccessEmail", {
                          email: `\`${finalInfo.email}\``,
                      })
                    : "";

                await statusMsg?.edit({
                    embeds: [
                        createEmbed(
                            "success",
                            __mf("commands.developers.login.loginSuccessDescription", {
                                email: emailSuffix,
                            }),
                            true,
                        ).setTitle(__("commands.developers.login.loginSuccess")),
                    ],
                });
            } else {
                const prefix = getEffectivePrefix(client, guildId);
                await statusMsg?.edit({
                    embeds: [
                        createEmbed(
                            "error",
                            __mf("commands.developers.login.loginFailedDescription", {
                                cmd: `\`${prefix}login start\``,
                            }),
                            true,
                        ).setTitle(__("commands.developers.login.loginFailed")),
                    ],
                });
            }

            return statusMsg ?? undefined;
        } catch (err) {
            const errorMsg = (err as Error).message;
            await statusMsg?.edit({
                embeds: [
                    createEmbed(
                        "error",
                        __mf("commands.developers.login.loginErrorDescription", {
                            error: `\`\`\`\n${errorMsg}\n\`\`\``,
                        }),
                        true,
                    ).setTitle(__("commands.developers.login.loginError")),
                ],
            });
            return statusMsg ?? undefined;
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

        let cookieEmoji: string;
        let cookieStatusText: string;

        switch (cookieInfo.status) {
            case "active":
                cookieEmoji = "🟢";
                cookieStatusText = __("commands.developers.login.statusActive");
                break;
            default:
                cookieEmoji = "🔴";
                cookieStatusText = __("commands.developers.login.statusMissing");
                break;
        }

        let loginEmoji: string;
        let loginText: string;

        switch (sessionInfo.status) {
            case "logged_in":
                loginEmoji = "🟢";
                loginText = __("commands.developers.login.sessionLoggedIn");
                break;
            case "waiting_for_login":
                loginEmoji = "🟡";
                loginText = __("commands.developers.login.sessionWaiting");
                break;
            case "error":
                loginEmoji = "🔴";
                loginText = __mf("commands.developers.login.sessionError", {
                    error: sessionInfo.error ?? "Unknown",
                });
                break;
            default:
                loginEmoji = "⚪";
                loginText = __("commands.developers.login.sessionIdle");
        }

        const lastRefresh = cookieInfo.lastRefresh
            ? `<t:${Math.floor(cookieInfo.lastRefresh / 1000)}:R>`
            : __("commands.developers.login.lastRefreshNever");

        const descriptionLines = [
            `${cookieEmoji} **${__("commands.developers.login.cookieFileField")}** — ${cookieStatusText}`,
            `${loginEmoji} **${__("commands.developers.login.googleLoginField")}** — ${loginText}`,
        ];

        const embed = createEmbed("info")
            .setTitle(__("commands.developers.login.statusTitle"))
            .setDescription(descriptionLines.join("\n"));

        const sizeText =
            cookieInfo.size > 0 ? `\`${(cookieInfo.size / 1024).toFixed(1)} KB\`` : "`N/A`";
        const accountText = sessionInfo.email
            ? `\`${sessionInfo.email}\``
            : __("commands.developers.login.accountNA");

        const statsValue = [
            `${__("commands.developers.login.sizeLabel")}: ${sizeText}`,
            `${__("commands.developers.login.lastRefreshLabel")}: ${lastRefresh}`,
            `${__("commands.developers.login.accountLabel")}: ${accountText}`,
        ].join(" | ");

        embed.addFields([
            {
                name: __("commands.developers.login.statsTitle"),
                value: statsValue,
            },
        ]);

        if (cookieInfo.status === "missing" && sessionInfo.status === "idle") {
            const prefix = getEffectivePrefix(client, ctx.guild?.id ?? null);
            embed.addFields([
                {
                    name: __("commands.developers.login.gettingStartedField"),
                    value: __mf("commands.developers.login.gettingStartedText", {
                        loginCmd: `\`${prefix}login start\``,
                    }),
                },
            ]);
        }

        return ctx.reply({ embeds: [embed] });
    }

    private async handleLogout(
        client: Rawon,
        ctx: CommandContext,
        __: ReturnType<typeof i18n__>,
        __mf: ReturnType<typeof i18n__mf>,
    ): Promise<Message | undefined> {
        const loginManager = client.cookies.loginManager;

        if (
            !loginManager.isLoggedIn() &&
            !loginManager.isBrowserRunning() &&
            !loginManager.hasCookies()
        ) {
            return ctx.reply({
                embeds: [createEmbed("warn", __("commands.developers.login.logoutNoBrowser"))],
            });
        }

        await loginManager.close();

        const prefix = getEffectivePrefix(client, ctx.guild?.id ?? null);
        return ctx.reply({
            embeds: [
                createEmbed(
                    "success",
                    __mf("commands.developers.login.logoutSuccess", {
                        cmd: `\`${prefix}login start\``,
                    }),
                    true,
                ),
            ],
        });
    }
}
