import { BaseCommand } from "../../structures/BaseCommand.js";
import { type CommandContext } from "../../structures/CommandContext.js";
import { Command } from "../../utils/decorators/Command.js";
import { createEmbed } from "../../utils/functions/createEmbed.js";
import { youtubeOAuth } from "../../utils/handlers/YouTubeOAuthManager.js";

@Command<typeof YTAuthCommand>({
    aliases: ["youtube-auth", "yt-oauth", "ytlogin"],
    cooldown: 0,
    description: "Setup YouTube OAuth for automatic token renewal (one-time setup)",
    devOnly: true,
    name: "ytauth",
    usage: "{prefix}ytauth [status|setup|logout]",
})
export class YTAuthCommand extends BaseCommand {
    public async execute(ctx: CommandContext): Promise<void> {
        const action = ctx.args[0]?.toLowerCase() ?? "status";

        switch (action) {
            case "status": {
                await this.showStatus(ctx);
                break;
            }
            case "setup": {
                await this.startSetup(ctx);
                break;
            }
            case "logout":
            case "clear":
            case "reset": {
                await this.clearAuth(ctx);
                break;
            }
            default: {
                await ctx.send({
                    embeds: [
                        createEmbed(
                            "error",
                            "Invalid action. Use `status`, `setup`, or `logout`.",
                            true,
                        ),
                    ],
                });
            }
        }
    }

    private async showStatus(ctx: CommandContext): Promise<void> {
        const isConfigured = youtubeOAuth.isConfigured;
        const accessToken = await youtubeOAuth.getAccessToken();

        const embed = createEmbed("info")
            .setTitle("🔐 YouTube OAuth Status")
            .addFields([
                {
                    name: "Status",
                    value: isConfigured ? "✅ Configured" : "❌ Not configured",
                    inline: true,
                },
                {
                    name: "Access Token",
                    value: accessToken ? "✅ Valid" : "❌ Invalid or expired",
                    inline: true,
                },
            ]);

        if (!isConfigured) {
            embed.setDescription(
                "YouTube OAuth is not configured. Run `ytauth setup` to configure it.\n\n" +
                    "**Benefits:**\n" +
                    "• No more manual cookie exports\n" +
                    "• Automatic token renewal\n" +
                    "• Works better with cloud hosting (OVH, AWS, etc.)",
            );
        }

        await ctx.send({ embeds: [embed] });
    }

    private async startSetup(ctx: CommandContext): Promise<void> {
        const setupEmbed = createEmbed("info")
            .setTitle("🔐 YouTube OAuth Setup")
            .setDescription("Starting OAuth device flow...");

        const msg = await ctx.send({ embeds: [setupEmbed] });

        try {
            const deviceCode = await youtubeOAuth.startDeviceFlow();

            const authEmbed = createEmbed("info")
                .setTitle("🔐 YouTube OAuth Setup")
                .setDescription(
                    `**Step 1:** Open this URL in your browser:\n` +
                        `${deviceCode.verificationUrl}\n\n` +
                        `**Step 2:** Enter this code:\n` +
                        `\`\`\`${deviceCode.userCode}\`\`\`\n\n` +
                        `**Step 3:** Sign in with your YouTube/Google account\n\n` +
                        `⏳ Waiting for authorization... (expires in ${Math.floor(deviceCode.expiresIn / 60)} minutes)`,
                )
                .setFooter({ text: "Use a throwaway account, not your main account!" });

            await msg.edit({ embeds: [authEmbed] });

            // Poll for token with expiration timeout
            const tokens = await youtubeOAuth.pollForToken(
                deviceCode.deviceCode,
                deviceCode.interval,
                deviceCode.expiresIn,
            );
            await youtubeOAuth.saveTokens(tokens);

            const successEmbed = createEmbed("success")
                .setTitle("✅ YouTube OAuth Setup Complete!")
                .setDescription(
                    "Your YouTube account has been linked successfully!\n\n" +
                        "**What happens now:**\n" +
                        "• Tokens will be automatically refreshed\n" +
                        "• No more cookie exports needed\n" +
                        "• No bot restart required for token refresh\n\n" +
                        "The refresh token has been saved to `cache/youtube-oauth.json`",
                );

            await msg.edit({ embeds: [successEmbed] });
        } catch (error) {
            const errorEmbed = createEmbed("error")
                .setTitle("❌ OAuth Setup Failed")
                .setDescription(`Error: ${(error as Error).message}`);

            await msg.edit({ embeds: [errorEmbed] });
        }
    }

    private async clearAuth(ctx: CommandContext): Promise<void> {
        await youtubeOAuth.clearTokens();

        await ctx.send({
            embeds: [createEmbed("success", "✅ YouTube OAuth tokens have been cleared.", true)],
        });
    }
}
