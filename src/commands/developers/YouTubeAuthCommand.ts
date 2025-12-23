import i18n from "../../config/index.js";
import { BaseCommand } from "../../structures/BaseCommand.js";
import { type CommandContext } from "../../structures/CommandContext.js";
import { Command } from "../../utils/decorators/Command.js";
import { createEmbed } from "../../utils/functions/createEmbed.js";
import { clearOAuthTokenGetter, setOAuthTokenGetter } from "../../utils/yt-dlp/index.js";

@Command<typeof YouTubeAuthCommand>({
    aliases: ["ytauth", "youtube-auth", "oauth"],
    cooldown: 0,
    description: i18n.__("commands.developers.youtubeauth.description"),
    devOnly: true,
    name: "youtubeauth",
    usage: i18n.__("commands.developers.youtubeauth.usage"),
})
export class YouTubeAuthCommand extends BaseCommand {
    public async execute(ctx: CommandContext): Promise<void> {
        const subCommand = ctx.args[0]?.toLowerCase();

        switch (subCommand) {
            case "setup":
                await this.handleSetup(ctx);
                break;
            case "status":
                await this.handleStatus(ctx);
                break;
            case "logout":
                await this.handleLogout(ctx);
                break;
            default:
                await this.showHelp(ctx);
                break;
        }
    }

    private async handleSetup(ctx: CommandContext): Promise<void> {
        if (this.client.youtubeOAuth.isConfigured()) {
            await ctx.send({
                embeds: [
                    createEmbed(
                        "warn",
                        i18n.__("commands.developers.youtubeauth.alreadyConfigured"),
                    ),
                ],
            });
            return;
        }

        // Send initial message
        await ctx.send({
            embeds: [createEmbed("info", i18n.__("commands.developers.youtubeauth.startingSetup"))],
        });

        try {
            // Start the device flow
            const deviceFlow = await this.client.youtubeOAuth.startDeviceFlow();

            // Send the verification info to the user
            await ctx.send({
                embeds: [
                    createEmbed("info")
                        .setTitle(i18n.__("commands.developers.youtubeauth.authTitle"))
                        .setDescription(i18n.__("commands.developers.youtubeauth.authInstructions"))
                        .addFields([
                            {
                                name: `🔗 ${i18n.__("commands.developers.youtubeauth.verificationUrlField")}`,
                                value: deviceFlow.verificationUrl,
                                inline: true,
                            },
                            {
                                name: `🔑 ${i18n.__("commands.developers.youtubeauth.codeField")}`,
                                value: `\`${deviceFlow.userCode}\``,
                                inline: true,
                            },
                        ])
                        .setFooter({
                            text: i18n.__mf("commands.developers.youtubeauth.expiresIn", {
                                seconds: deviceFlow.expiresIn,
                            }),
                        }),
                ],
            });

            // Wait for user to complete authorization
            const waitingMsg = await ctx.send({
                embeds: [
                    createEmbed(
                        "info",
                        `⏳ **|** ${i18n.__("commands.developers.youtubeauth.waitingForAuth")}`,
                    ),
                ],
            });

            const success = await this.client.youtubeOAuth.completeDeviceFlow(
                deviceFlow.deviceCode,
                deviceFlow.interval,
            );

            if (success) {
                // Set up the OAuth token getter for yt-dlp
                setOAuthTokenGetter(() => this.client.youtubeOAuth.getAccessToken());

                await waitingMsg.edit({
                    embeds: [
                        createEmbed(
                            "success",
                            i18n.__("commands.developers.youtubeauth.setupComplete"),
                            true,
                        ),
                    ],
                });
            } else {
                await waitingMsg.edit({
                    embeds: [
                        createEmbed(
                            "error",
                            i18n.__("commands.developers.youtubeauth.setupFailed"),
                            true,
                        ),
                    ],
                });
            }
        } catch (error) {
            this.client.logger.error("YOUTUBE_AUTH", error);
            await ctx.send({
                embeds: [
                    createEmbed(
                        "error",
                        i18n.__mf("commands.developers.youtubeauth.setupError", {
                            error: (error as Error).message,
                        }),
                        true,
                    ),
                ],
            });
        }
    }

    private async handleStatus(ctx: CommandContext): Promise<void> {
        if (!this.client.youtubeOAuth.isConfigured()) {
            await ctx.send({
                embeds: [
                    createEmbed("info", i18n.__("commands.developers.youtubeauth.notConfigured")),
                ],
            });
            return;
        }

        const expiryInfo = this.client.youtubeOAuth.getExpiryInfo();

        await ctx.send({
            embeds: [
                createEmbed("info")
                    .setTitle(i18n.__("commands.developers.youtubeauth.statusTitle"))
                    .addFields([
                        {
                            name: i18n.__("commands.developers.youtubeauth.statusField"),
                            value: `✅ ${i18n.__("commands.developers.youtubeauth.statusConfigured")}`,
                            inline: true,
                        },
                        {
                            name: i18n.__("commands.developers.youtubeauth.tokenStatusField"),
                            value: expiryInfo?.isExpired
                                ? `⚠️ ${i18n.__("commands.developers.youtubeauth.tokenExpired")}`
                                : `✅ ${i18n.__("commands.developers.youtubeauth.tokenValid")}`,
                            inline: true,
                        },
                        {
                            name: i18n.__("commands.developers.youtubeauth.expiresAtField"),
                            value: expiryInfo
                                ? `<t:${Math.floor(expiryInfo.expiresAt.getTime() / 1000)}:R>`
                                : i18n.__("commands.developers.youtubeauth.unknown"),
                            inline: true,
                        },
                    ]),
            ],
        });
    }

    private async handleLogout(ctx: CommandContext): Promise<void> {
        if (!this.client.youtubeOAuth.isConfigured()) {
            await ctx.send({
                embeds: [
                    createEmbed("info", i18n.__("commands.developers.youtubeauth.notConfigured")),
                ],
            });
            return;
        }

        await this.client.youtubeOAuth.clear();
        clearOAuthTokenGetter();

        await ctx.send({
            embeds: [
                createEmbed("success", i18n.__("commands.developers.youtubeauth.loggedOut"), true),
            ],
        });
    }

    private async showHelp(ctx: CommandContext): Promise<void> {
        const prefix = this.client.config.mainPrefix;
        await ctx.send({
            embeds: [
                createEmbed("info")
                    .setTitle(i18n.__("commands.developers.youtubeauth.helpTitle"))
                    .setDescription(i18n.__("commands.developers.youtubeauth.helpDescription"))
                    .addFields([
                        {
                            name: `\`${prefix}youtubeauth setup\``,
                            value: i18n.__("commands.developers.youtubeauth.helpSetup"),
                        },
                        {
                            name: `\`${prefix}youtubeauth status\``,
                            value: i18n.__("commands.developers.youtubeauth.helpStatus"),
                        },
                        {
                            name: `\`${prefix}youtubeauth logout\``,
                            value: i18n.__("commands.developers.youtubeauth.helpLogout"),
                        },
                    ]),
            ],
        });
    }
}
