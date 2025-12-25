import { ApplicationCommandOptionType, type Message } from "discord.js";
import i18n from "../../config/index.js";
import { BaseCommand } from "../../structures/BaseCommand.js";
import { type CommandContext } from "../../structures/CommandContext.js";
import { Command } from "../../utils/decorators/Command.js";
import { createEmbed } from "../../utils/functions/createEmbed.js";

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
                description: i18n.__("commands.developers.cookies.slashResetDescription"),
                name: "reset",
                type: ApplicationCommandOptionType.Subcommand,
            },
        ],
    },
    usage: i18n.__("commands.developers.cookies.usage"),
})
export class CookiesCommand extends BaseCommand {
    public async execute(ctx: CommandContext): Promise<Message | undefined> {
        const subcommand = ctx.options?.getSubcommand() ?? ctx.args[0]?.toLowerCase();

        if (!subcommand) {
            return ctx.reply({
                embeds: [
                    createEmbed(
                        "warn",
                        i18n.__mf("reusable.invalidUsage", {
                            prefix: `${this.client.config.mainPrefix}help`,
                            name: this.meta.name,
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
            case "reset":
                return this.handleReset(ctx);
            default:
                return ctx.reply({
                    embeds: [
                        createEmbed(
                            "warn",
                            i18n.__mf("reusable.invalidUsage", {
                                prefix: `${this.client.config.mainPrefix}help`,
                                name: this.meta.name,
                            }),
                        ),
                    ],
                });
        }
    }

    private async handleAdd(ctx: CommandContext): Promise<Message | undefined> {
        const number = ctx.options?.getInteger("number") ?? Number.parseInt(ctx.args[1] ?? "", 10);

        if (Number.isNaN(number) || number < 1) {
            return ctx.reply({
                embeds: [
                    createEmbed(
                        "error",
                        i18n.__("commands.developers.cookies.invalidNumber"),
                        true,
                    ),
                ],
            });
        }

        // Check for attachment
        const message = ctx.context;
        let attachment: { url: string; name: string } | null = null;

        if ("attachments" in message && message.attachments.size > 0) {
            const firstAttachment = message.attachments.first();
            if (firstAttachment) {
                attachment = { url: firstAttachment.url, name: firstAttachment.name ?? "unknown" };
            }
        }

        if (!attachment) {
            return ctx.reply({
                embeds: [
                    createEmbed("error", i18n.__("commands.developers.cookies.noAttachment"), true),
                ],
            });
        }

        // Check if the attachment is a .txt file
        if (!attachment.name.endsWith(".txt")) {
            return ctx.reply({
                embeds: [
                    createEmbed(
                        "error",
                        i18n.__("commands.developers.cookies.invalidFileType"),
                        true,
                    ),
                ],
            });
        }

        try {
            // Download the attachment content
            const response = await this.client.request.get(attachment.url);
            const content = response.body;

            // Validate it looks like a cookies file (more robust check)
            // Netscape cookie format: domain, flag, path, secure, expiration, name, value
            const lines = content.split("\n");
            let hasValidCookieLine = false;
            let hasYoutubeDomain = false;

            for (const line of lines) {
                const trimmedLine = line.trim();

                // Skip empty lines and comments
                if (trimmedLine === "" || trimmedLine.startsWith("#")) {
                    // Check for Netscape header
                    if (trimmedLine.includes("Netscape HTTP Cookie File")) {
                        hasValidCookieLine = true;
                    }
                    continue;
                }

                // Cookie lines should have tab-separated fields
                const fields = trimmedLine.split("\t");
                if (fields.length >= 7) {
                    hasValidCookieLine = true;
                    const domain = fields[0];
                    // Check if it's a YouTube related domain
                    // Domain in cookie files starts with . or is the exact domain
                    // e.g. ".youtube.com", "youtube.com", ".google.com"
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
                            i18n.__("commands.developers.cookies.invalidCookiesFile"),
                            true,
                        ),
                    ],
                });
            }

            // Warn if no YouTube domain found but still allow
            if (!hasYoutubeDomain) {
                this.client.logger.warn(
                    `[CookiesCommand] Cookie file for index ${number} does not contain YouTube domains`,
                );
            }

            // Save the cookie
            const result = this.client.cookies.addCookie(number, content);

            if (result === "added") {
                return ctx.reply({
                    embeds: [
                        createEmbed(
                            "success",
                            i18n.__mf("commands.developers.cookies.addSuccess", {
                                number: number.toString(),
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
                            i18n.__mf("commands.developers.cookies.replaceSuccess", {
                                number: number.toString(),
                            }),
                            true,
                        ),
                    ],
                });
            }
            return ctx.reply({
                embeds: [
                    createEmbed("error", i18n.__("commands.developers.cookies.addFailed"), true),
                ],
            });
        } catch (error) {
            this.client.logger.error("COOKIES_ADD_ERR:", error);
            return ctx.reply({
                embeds: [
                    createEmbed(
                        "error",
                        i18n.__mf("commands.developers.cookies.addError", {
                            error: (error as Error).message,
                        }),
                        true,
                    ),
                ],
            });
        }
    }

    private async handleRemove(ctx: CommandContext): Promise<Message | undefined> {
        const target = ctx.options?.getString("target") ?? ctx.args[1]?.toLowerCase();

        if (!target) {
            return ctx.reply({
                embeds: [
                    createEmbed(
                        "error",
                        i18n.__("commands.developers.cookies.noRemoveTarget"),
                        true,
                    ),
                ],
            });
        }

        if (target === "all") {
            const count = this.client.cookies.removeAllCookies();
            return ctx.reply({
                embeds: [
                    createEmbed(
                        "success",
                        i18n.__mf("commands.developers.cookies.removeAllSuccess", {
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
                    createEmbed(
                        "error",
                        i18n.__("commands.developers.cookies.invalidRemoveTarget"),
                        true,
                    ),
                ],
            });
        }

        const success = this.client.cookies.removeCookie(number);

        if (success) {
            return ctx.reply({
                embeds: [
                    createEmbed(
                        "success",
                        i18n.__mf("commands.developers.cookies.removeSuccess", {
                            number: number.toString(),
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
                    i18n.__mf("commands.developers.cookies.removeNotFound", {
                        number: number.toString(),
                    }),
                    true,
                ),
            ],
        });
    }

    private async handleList(ctx: CommandContext): Promise<Message | undefined> {
        const cookies = this.client.cookies.listCookies();

        if (cookies.length === 0) {
            return ctx.reply({
                embeds: [createEmbed("info", i18n.__("commands.developers.cookies.noCookies"))],
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
                        statusText = i18n.__("commands.developers.cookies.statusActive");
                        break;
                    case "failed":
                        emoji = "🔴";
                        statusText = i18n.__("commands.developers.cookies.statusFailed");
                        break;
                    default:
                        emoji = "🟡";
                        statusText = i18n.__("commands.developers.cookies.statusAvailable");
                }

                return `${emoji} **\`Cookie ${index}\`** - ${statusText}`;
            })
            .join("\n");

        const embed = createEmbed("info")
            .setTitle(`🍪 ${i18n.__("commands.developers.cookies.listTitle")}`)
            .setDescription(cookieList)
            .addFields([
                {
                    name: i18n.__("commands.developers.cookies.statsTitle"),
                    value: i18n.__mf("commands.developers.cookies.statsValue", {
                        total: cookies.length.toString(),
                        failed: this.client.cookies.getFailedCookieCount().toString(),
                        current: this.client.cookies.getCurrentCookieIndex().toString(),
                    }),
                },
            ]);

        if (this.client.cookies.areAllCookiesFailed()) {
            embed.addFields([
                {
                    name: `⚠️ ${i18n.__("commands.developers.cookies.warningTitle")}`,
                    value: i18n.__("commands.developers.cookies.allCookiesFailed"),
                },
            ]);
        }

        return ctx.reply({ embeds: [embed] });
    }

    private async handleReset(ctx: CommandContext): Promise<Message | undefined> {
        this.client.cookies.resetFailedStatus();
        return ctx.reply({
            embeds: [
                createEmbed("success", i18n.__("commands.developers.cookies.resetSuccess"), true),
            ],
        });
    }

    /**
     * Check if a domain string is a valid YouTube/Google related domain
     * Used for validating cookie file contents
     */
    private isYouTubeRelatedDomain(domain: string): boolean {
        // Normalize the domain (remove leading dot if present)
        const normalizedDomain = domain.startsWith(".") ? domain.slice(1) : domain;

        // List of valid YouTube/Google domains for cookies
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

        // Check if the normalized domain ends with any of the valid domains
        return validDomains.some(
            (validDomain) =>
                normalizedDomain === validDomain || normalizedDomain.endsWith(`.${validDomain}`),
        );
    }
}
