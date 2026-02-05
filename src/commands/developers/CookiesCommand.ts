/** biome-ignore-all lint/style/useNamingConvention: disable naming convention rule for this file */
import { Buffer } from "node:buffer";
import { ApplyOptions } from "@sapphire/decorators";
import { type Command } from "@sapphire/framework";
import { type CommandContext, ContextCommand } from "@stegripe/command-context";
import {
    AttachmentBuilder,
    type Message,
    PermissionFlagsBits,
    type SlashCommandBuilder,
} from "discord.js";
import i18n from "../../config/index.js";
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
                    .setName("add")
                    .setDescription(i18n.__("commands.developers.cookies.slashAddDescription"))
                    .addIntegerOption((opt) =>
                        opt
                            .setName("number")
                            .setDescription(
                                i18n.__("commands.developers.cookies.slashNumberDescription"),
                            )
                            .setRequired(true)
                            .setMinValue(1),
                    )
                    .addStringOption((opt) =>
                        opt
                            .setName("url")
                            .setDescription(
                                i18n.__("commands.developers.cookies.slashUrlDescription"),
                            )
                            .setRequired(false),
                    ),
            )
            .addSubcommand((sub) =>
                sub
                    .setName("remove")
                    .setDescription(i18n.__("commands.developers.cookies.slashRemoveDescription"))
                    .addStringOption((opt) =>
                        opt
                            .setName("target")
                            .setDescription(
                                i18n.__("commands.developers.cookies.slashRemoveTargetDescription"),
                            )
                            .setRequired(true),
                    ),
            )
            .addSubcommand((sub) =>
                sub
                    .setName("list")
                    .setDescription(i18n.__("commands.developers.cookies.slashListDescription")),
            )
            .addSubcommand((sub) =>
                sub
                    .setName("view")
                    .setDescription(i18n.__("commands.developers.cookies.slashViewDescription"))
                    .addIntegerOption((opt) =>
                        opt
                            .setName("number")
                            .setDescription(
                                i18n.__("commands.developers.cookies.slashNumberDescription"),
                            )
                            .setRequired(true)
                            .setMinValue(1),
                    ),
            )
            .addSubcommand((sub) =>
                sub
                    .setName("reset")
                    .setDescription(i18n.__("commands.developers.cookies.slashResetDescription")),
            )
            .addSubcommand((sub) =>
                sub
                    .setName("use")
                    .setDescription(i18n.__("commands.developers.cookies.slashUseDescription"))
                    .addIntegerOption((opt) =>
                        opt
                            .setName("number")
                            .setDescription(
                                i18n.__("commands.developers.cookies.slashNumberDescription"),
                            )
                            .setRequired(true)
                            .setMinValue(1),
                    ),
            ) as SlashCommandBuilder;
    },
})
export class CookiesCommand extends ContextCommand {
    private get client(): Rawon {
        return this.container.client as Rawon;
    }

    private formatCookie(number: number): string {
        return `**\`Cookie ${number}\`**`;
    }

    private formatUsage(prefix: string): string {
        return `\`${prefix}cookies add <number>\``;
    }

    private formatResetCmd(): string {
        return `\`${this.client.config.mainPrefix}cookies reset\``;
    }

    public async contextRun(ctx: CommandContext): Promise<Message | undefined> {
        const __mf = i18n__mf(this.client, ctx.guild);
        const subcommand = ctx.options?.getSubcommand() ?? ctx.args[0]?.toLowerCase();

        if (!subcommand) {
            return ctx.reply({
                embeds: [
                    createEmbed(
                        "warn",
                        __mf("reusable.invalidUsage", {
                            prefix: `**\`${this.client.config.mainPrefix}help\`**`,
                            name: `**\`${this.options.name}\`**`,
                        }),
                    ),
                ],
            });
        }

        switch (subcommand) {
            case "add":
                return this.handleAdd(ctx);
            case "remove":
                return this.handleRemove(ctx);
            case "list":
                return this.handleList(ctx);
            case "view":
                return this.handleView(ctx);
            case "reset":
                return this.handleReset(ctx);
            case "use":
                return this.handleUse(ctx);
            default:
                return ctx.reply({
                    embeds: [
                        createEmbed(
                            "warn",
                            __mf("reusable.invalidUsage", {
                                prefix: `**\`${this.client.config.mainPrefix}help\`**`,
                                name: `**\`${this.options.name}\`**`,
                            }),
                        ),
                    ],
                });
        }
    }

    private async handleAdd(ctx: CommandContext): Promise<Message | undefined> {
        const __ = i18n__(this.client, ctx.guild);
        const __mf = i18n__mf(this.client, ctx.guild);
        const number = ctx.options?.getInteger("number") ?? Number.parseInt(ctx.args[1] ?? "", 10);

        if (Number.isNaN(number) || number < 1) {
            return ctx.reply({
                embeds: [createEmbed("warn", __("commands.developers.cookies.invalidNumber"))],
            });
        }

        const message = ctx.context;
        let attachment: { url: string; name: string } | null = null;

        if ("attachments" in message && message.attachments.size > 0) {
            const firstAttachment = message.attachments.first();
            if (firstAttachment) {
                attachment = { url: firstAttachment.url, name: firstAttachment.name ?? "unknown" };
            }
        }

        const urlArg = (ctx.options?.getString("url") ?? ctx.args[2] ?? null) as string | null;
        if (!attachment && urlArg) {
            try {
                const parsed = new URL(urlArg);
                const nameFromPath = parsed.pathname.split("/").pop() ?? parsed.hostname;
                attachment = { url: parsed.toString(), name: nameFromPath };
            } catch {
                return ctx.reply({
                    embeds: [
                        createEmbed("warn", __("commands.developers.cookies.invalidFileType")),
                    ],
                });
            }
        }

        if (!attachment) {
            return ctx.reply({
                embeds: [createEmbed("warn", __("commands.developers.cookies.noAttachment"))],
            });
        }

        if (!attachment.name.endsWith(".txt")) {
            return ctx.reply({
                embeds: [createEmbed("warn", __("commands.developers.cookies.invalidFileType"))],
            });
        }

        try {
            const response = await this.client.request.get(attachment.url);
            const content = response.body;

            const lines = content.split("\n");
            let hasValidCookieLine = false;
            let hasYoutubeDomain = false;

            for (const line of lines) {
                const trimmedLine = line.trim();

                if (trimmedLine === "" || trimmedLine.startsWith("#")) {
                    if (trimmedLine.includes("Netscape HTTP Cookie File")) {
                        hasValidCookieLine = true;
                    }
                    continue;
                }

                const fields = trimmedLine.split("\t");
                if (fields.length >= 7) {
                    hasValidCookieLine = true;
                    const domain = fields[0];
                    if (this.isYouTubeRelatedDomain(domain)) {
                        hasYoutubeDomain = true;
                    }
                }
            }

            if (!hasValidCookieLine) {
                return ctx.reply({
                    embeds: [
                        createEmbed(
                            "error",
                            __("commands.developers.cookies.invalidCookiesFile"),
                            true,
                        ),
                    ],
                });
            }

            if (!hasYoutubeDomain) {
                this.container.logger.warn(
                    `[CookiesCommand] Cookie file for index ${number} does not contain YouTube domains`,
                );
            }

            const result = this.client.cookies.addCookie(number, content);

            if (result === "added") {
                return ctx.reply({
                    embeds: [
                        createEmbed(
                            "success",
                            __mf("commands.developers.cookies.addSuccess", {
                                cookie: this.formatCookie(number),
                            }),
                            true,
                        ),
                    ],
                });
            }
            if (result === "replaced") {
                return ctx.reply({
                    embeds: [
                        createEmbed(
                            "success",
                            __mf("commands.developers.cookies.replaceSuccess", {
                                cookie: this.formatCookie(number),
                            }),
                            true,
                        ),
                    ],
                });
            }
            return ctx.reply({
                embeds: [createEmbed("error", __("commands.developers.cookies.addFailed"), true)],
            });
        } catch (error) {
            this.container.logger.error("COOKIES_ADD_ERR:", error);
            return ctx.reply({
                embeds: [
                    createEmbed(
                        "error",
                        __mf("commands.developers.cookies.addError", {
                            error: (error as Error).message,
                        }),
                        true,
                    ),
                ],
            });
        }
    }

    private async handleRemove(ctx: CommandContext): Promise<Message | undefined> {
        const __ = i18n__(this.client, ctx.guild);
        const __mf = i18n__mf(this.client, ctx.guild);
        const target = ctx.options?.getString("target") ?? ctx.args[1]?.toLowerCase();

        if (!target) {
            return ctx.reply({
                embeds: [createEmbed("warn", __("commands.developers.cookies.noRemoveTarget"))],
            });
        }

        if (target === "all") {
            const count = this.client.cookies.removeAllCookies();
            return ctx.reply({
                embeds: [
                    createEmbed(
                        "success",
                        __mf("commands.developers.cookies.removeAllSuccess", {
                            count: count.toString(),
                        }),
                        true,
                    ),
                ],
            });
        }

        const number = Number.parseInt(target, 10);
        if (Number.isNaN(number) || number < 1) {
            return ctx.reply({
                embeds: [
                    createEmbed("warn", __("commands.developers.cookies.invalidRemoveTarget")),
                ],
            });
        }

        const success = this.client.cookies.removeCookie(number);

        if (success) {
            return ctx.reply({
                embeds: [
                    createEmbed(
                        "success",
                        __mf("commands.developers.cookies.removeSuccess", {
                            cookie: this.formatCookie(number),
                        }),
                        true,
                    ),
                ],
            });
        }
        return ctx.reply({
            embeds: [
                createEmbed(
                    "error",
                    __mf("commands.developers.cookies.removeNotFound", {
                        cookie: this.formatCookie(number),
                    }),
                    true,
                ),
            ],
        });
    }

    private async handleList(ctx: CommandContext): Promise<Message | undefined> {
        const __ = i18n__(this.client, ctx.guild);
        const __mf = i18n__mf(this.client, ctx.guild);
        const cookies = this.client.cookies.listCookies();

        if (cookies.length === 0) {
            return ctx.reply({
                embeds: [
                    createEmbed(
                        "warn",
                        __mf("commands.developers.cookies.noCookies", {
                            usage: this.formatUsage(this.client.config.mainPrefix),
                        }),
                    ),
                ],
            });
        }

        const cookieList = cookies
            .map((index) => {
                const status = this.client.cookies.getCookieStatus(index);
                let emoji: string;
                let statusText: string;

                switch (status) {
                    case "active":
                        emoji = "🟢";
                        statusText = __("commands.developers.cookies.statusActive");
                        break;
                    case "failed":
                        emoji = "🔴";
                        statusText = __("commands.developers.cookies.statusFailed");
                        break;
                    default:
                        emoji = "🟡";
                        statusText = __("commands.developers.cookies.statusAvailable");
                }

                return `${emoji} ${this.formatCookie(index)} - ${statusText}`;
            })
            .join("\n");

        const currentCookie = this.client.cookies.getCurrentCookieIndex();
        const statsValue = `${__("commands.developers.cookies.statsTotal")}: \`${cookies.length}\` | ${__("commands.developers.cookies.statsFailed")}: \`${this.client.cookies.getFailedCookieCount()}\` | ${__("commands.developers.cookies.statsCurrent")}: ${this.formatCookie(currentCookie)}`;

        const embed = createEmbed("info")
            .setTitle(`🍪 ${__("commands.developers.cookies.listTitle")}`)
            .setDescription(cookieList)
            .addFields([
                {
                    name: __("commands.developers.cookies.statsTitle"),
                    value: statsValue,
                },
            ]);

        if (this.client.cookies.areAllCookiesFailed()) {
            embed.addFields([
                {
                    name: `⚠️ ${__("commands.developers.cookies.warningTitle")}`,
                    value: __mf("commands.developers.cookies.allCookiesFailed", {
                        resetCmd: this.formatResetCmd(),
                    }),
                },
            ]);
        }

        return ctx.reply({ embeds: [embed] });
    }

    private async handleView(ctx: CommandContext): Promise<Message | undefined> {
        const __ = i18n__(this.client, ctx.guild);
        const __mf = i18n__mf(this.client, ctx.guild);
        const number = ctx.options?.getInteger("number") ?? Number.parseInt(ctx.args[1] ?? "", 10);

        if (Number.isNaN(number) || number < 1) {
            return ctx.reply({
                embeds: [createEmbed("warn", __("commands.developers.cookies.invalidNumber"))],
            });
        }

        const content = this.client.cookies.getCookieContent(number);

        if (content === null) {
            return ctx.reply({
                embeds: [
                    createEmbed(
                        "error",
                        __mf("commands.developers.cookies.viewNotFound", {
                            cookie: this.formatCookie(number),
                        }),
                        true,
                    ),
                ],
            });
        }

        const attachment = new AttachmentBuilder(Buffer.from(content, "utf8"), {
            name: `cookies-${number}.txt`,
        });

        const status = this.client.cookies.getCookieStatus(number);
        let emoji: string;
        let statusText: string;

        switch (status) {
            case "active":
                emoji = "🟢";
                statusText = __("commands.developers.cookies.statusActive");
                break;
            case "failed":
                emoji = "🔴";
                statusText = __("commands.developers.cookies.statusFailed");
                break;
            default:
                emoji = "🟡";
                statusText = __("commands.developers.cookies.statusAvailable");
        }

        const embed = createEmbed(
            "info",
            __mf("commands.developers.cookies.viewSuccess", {
                cookie: this.formatCookie(number),
            }),
        ).addFields([
            {
                name: __("commands.developers.cookies.viewStatusTitle"),
                value: `${emoji} ${statusText}`,
                inline: true,
            },
            {
                name: __("commands.developers.cookies.viewSizeTitle"),
                value: `\`${content.length}\` bytes`,
                inline: true,
            },
        ]);

        return ctx.reply({ embeds: [embed], files: [attachment] });
    }

    private async handleReset(ctx: CommandContext): Promise<Message | undefined> {
        const __ = i18n__(this.client, ctx.guild);
        this.client.cookies.resetFailedStatus();
        return ctx.reply({
            embeds: [createEmbed("success", __("commands.developers.cookies.resetSuccess"), true)],
        });
    }

    private async handleUse(ctx: CommandContext): Promise<Message | undefined> {
        const __ = i18n__(this.client, ctx.guild);
        const __mf = i18n__mf(this.client, ctx.guild);
        const number = ctx.options?.getInteger("number") ?? Number.parseInt(ctx.args[1] ?? "", 10);

        if (Number.isNaN(number) || number < 1) {
            return ctx.reply({
                embeds: [createEmbed("warn", __("commands.developers.cookies.invalidNumber"))],
            });
        }

        const result = this.client.cookies.useCookie(number);

        if (result === "success") {
            return ctx.reply({
                embeds: [
                    createEmbed(
                        "success",
                        __mf("commands.developers.cookies.useSuccess", {
                            cookie: this.formatCookie(number),
                        }),
                        true,
                    ),
                ],
            });
        }

        if (result === "not_found") {
            return ctx.reply({
                embeds: [
                    createEmbed(
                        "error",
                        __mf("commands.developers.cookies.useNotFound", {
                            cookie: this.formatCookie(number),
                        }),
                        true,
                    ),
                ],
            });
        }

        return ctx.reply({
            embeds: [
                createEmbed(
                    "error",
                    __mf("commands.developers.cookies.useFailed", {
                        cookie: this.formatCookie(number),
                    }),
                    true,
                ),
            ],
        });
    }

    private isYouTubeRelatedDomain(domain: string): boolean {
        const normalizedDomain = domain.startsWith(".") ? domain.slice(1) : domain;

        const validDomains = [
            "youtube.com",
            "www.youtube.com",
            "m.youtube.com",
            "music.youtube.com",
            "youtu.be",
            "google.com",
            "www.google.com",
            "accounts.google.com",
            "googleapis.com",
            "googlevideo.com",
        ];

        return validDomains.some(
            (validDomain) =>
                normalizedDomain === validDomain || normalizedDomain.endsWith(`.${validDomain}`),
        );
    }
}
