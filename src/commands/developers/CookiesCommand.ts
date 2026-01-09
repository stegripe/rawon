import { Buffer } from "node:buffer";
import { ApplicationCommandOptionType, AttachmentBuilder, type Message } from "discord.js";
import i18n from "../../config/index.js";
import { BaseCommand } from "../../structures/BaseCommand.js";
import { type CommandContext } from "../../structures/CommandContext.js";
import { Command } from "../../utils/decorators/Command.js";
import { createEmbed } from "../../utils/functions/createEmbed.js";
import { i18n__, i18n__mf } from "../../utils/functions/i18n.js";

@Command<typeof CookiesCommand>({
    aliases: ["cookie", "ck"],
    cooldown: 3,
    description: i18n.__("commands.developers.cookies.description"),
    devOnly: true,
    name: "cookies",
    slash: {
        description: i18n.__("commands.developers.cookies.description"),
        options: [
            {
                description: i18n.__("commands.developers.cookies.slashAddDescription"),
                name: "add",
                type: ApplicationCommandOptionType.Subcommand,
                options: [
                    {
                        description: i18n.__("commands.developers.cookies.slashNumberDescription"),
                        name: "number",
                        type: ApplicationCommandOptionType.Integer,
                        required: true,
                        minValue: 1,
                    },
                    {
                        description: i18n.__("commands.developers.cookies.slashUrlDescription"),
                        name: "url",
                        type: ApplicationCommandOptionType.String,
                        required: false,
                    },
                ],
            },
            {
                description: i18n.__("commands.developers.cookies.slashRemoveDescription"),
                name: "remove",
                type: ApplicationCommandOptionType.Subcommand,
                options: [
                    {
                        description: i18n.__(
                            "commands.developers.cookies.slashRemoveTargetDescription",
                        ),
                        name: "target",
                        type: ApplicationCommandOptionType.String,
                        required: true,
                    },
                ],
            },
            {
                description: i18n.__("commands.developers.cookies.slashListDescription"),
                name: "list",
                type: ApplicationCommandOptionType.Subcommand,
            },
            {
                description: i18n.__("commands.developers.cookies.slashViewDescription"),
                name: "view",
                type: ApplicationCommandOptionType.Subcommand,
                options: [
                    {
                        description: i18n.__("commands.developers.cookies.slashNumberDescription"),
                        name: "number",
                        type: ApplicationCommandOptionType.Integer,
                        required: true,
                        minValue: 1,
                    },
                ],
            },
            {
                description: i18n.__("commands.developers.cookies.slashResetDescription"),
                name: "reset",
                type: ApplicationCommandOptionType.Subcommand,
            },
            {
                description: i18n.__("commands.developers.cookies.slashUseDescription"),
                name: "use",
                type: ApplicationCommandOptionType.Subcommand,
                options: [
                    {
                        description: i18n.__("commands.developers.cookies.slashNumberDescription"),
                        name: "number",
                        type: ApplicationCommandOptionType.Integer,
                        required: true,
                        minValue: 1,
                    },
                ],
            },
        ],
    },
    usage: i18n.__("commands.developers.cookies.usage"),
})
export class CookiesCommand extends BaseCommand {
    private formatCookie(number: number): string {
        return `**\`Cookie ${number}\`**`;
    }

    private formatUsage(prefix: string): string {
        return `\`${prefix}cookies add <number>\``;
    }

    private formatResetCmd(): string {
        return `\`cookies reset\``;
    }

    public async execute(ctx: CommandContext): Promise<Message | undefined> {
        const __mf = i18n__mf(this.client, ctx.guild);
        const subcommand = ctx.options?.getSubcommand() ?? ctx.args[0]?.toLowerCase();

        if (!subcommand) {
            return ctx.reply({
                embeds: [
                    createEmbed(
                        "warn",
                        __mf("reusable.invalidUsage", {
                            prefix: `**\`${this.client.config.mainPrefix}help\`**`,
                            name: `**\`${this.meta.name}\`**`,
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
                                name: `**\`${this.meta.name}\`**`,
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
                this.client.logger.warn(
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
            this.client.logger.error("COOKIES_ADD_ERR:", error);
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
