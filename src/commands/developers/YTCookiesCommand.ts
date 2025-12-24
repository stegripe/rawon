import process from "node:process";
import { enableBrowserLogin } from "../../config/env.js";
import { BaseCommand } from "../../structures/BaseCommand.js";
import { type CommandContext } from "../../structures/CommandContext.js";
import { Command } from "../../utils/decorators/Command.js";
import { createEmbed } from "../../utils/functions/createEmbed.js";
import { youtubeCookieManager } from "../../utils/handlers/YouTubeCookieManager.js";

@Command<typeof YTCookiesCommand>({
    aliases: ["ytcookie", "yt-cookies", "youtube-cookies"],
    cooldown: 0,
    description: "Manage YouTube cookies for authenticated playback",
    devOnly: true,
    name: "ytcookies",
    usage: "<status|login|save|cancel|clear>",
})
export class YTCookiesCommand extends BaseCommand {
    public async execute(ctx: CommandContext): Promise<void> {
        const subcommand = ctx.args[0]?.toLowerCase() ?? "status";

        // Check if browser login feature is enabled
        if (!enableBrowserLogin && subcommand === "login") {
            await ctx.send({
                embeds: [
                    createEmbed(
                        "error",
                        "Browser login feature is disabled.\n\n" +
                            "To enable it, set `ENABLE_BROWSER_LOGIN=yes` in your environment file (`.env` or `dev.env`) and restart the bot.\n\n" +
                            "**Required env variables for browser login:**\n" +
                            "```\n" +
                            "ENABLE_BROWSER_LOGIN=yes\n" +
                            "BROWSER_DEBUG_PORT=9222\n" +
                            "BROWSER_INSTRUCTIONS_PORT=9223\n" +
                            "PUBLIC_HOST=your-server-ip\n" +
                            "```\n\n" +
                            "**Note:** This feature requires Chromium to be installed in the Docker container.",
                        true,
                    ),
                ],
            });
            return;
        }

        switch (subcommand) {
            case "status": {
                await this.showStatus(ctx);
                break;
            }
            case "login": {
                await this.startLogin(ctx);
                break;
            }
            case "save": {
                await this.saveCookies(ctx);
                break;
            }
            case "cancel": {
                await this.cancelLogin(ctx);
                break;
            }
            case "clear": {
                await this.clearCookies(ctx);
                break;
            }
            default: {
                await ctx.send({
                    embeds: [
                        createEmbed(
                            "error",
                            "Invalid subcommand. Use: `status`, `login`, `save`, `cancel`, or `clear`",
                            true,
                        ),
                    ],
                });
            }
        }
    }

    private async showStatus(ctx: CommandContext): Promise<void> {
        const info = youtubeCookieManager.getSessionInfo();

        const embed = createEmbed("info")
            .setTitle("🍪 YouTube Cookies Status")
            .addFields([
                {
                    name: "Cookies Configured",
                    value: info.isConfigured ? "✅ Yes" : "❌ No",
                    inline: true,
                },
                {
                    name: "Cookies File Exists",
                    value: info.cookiesFileExists ? "✅ Yes" : "❌ No",
                    inline: true,
                },
                {
                    name: "Last Updated",
                    value: info.lastUpdated
                        ? `<t:${Math.floor(info.lastUpdated / 1000)}:R>`
                        : "Never",
                    inline: true,
                },
                {
                    name: "Active Login Session",
                    value: youtubeCookieManager.hasActiveLoginSession ? "✅ Yes" : "❌ No",
                    inline: true,
                },
            ]);

        if (!info.isConfigured) {
            embed.setDescription(
                "**No cookies configured!**\n\n" +
                    "To set up YouTube cookies:\n" +
                    "1. Run `ytcookies login` to start a browser session\n" +
                    "2. Follow the instructions to log into Google\n" +
                    "3. Run `ytcookies save` to save the cookies\n\n" +
                    "⚠️ **Use a throwaway Google account, not your main one!**",
            );
        }

        await ctx.send({ embeds: [embed] });
    }

    private async startLogin(ctx: CommandContext): Promise<void> {
        if (youtubeCookieManager.hasActiveLoginSession) {
            const embed = createEmbed("warn")
                .setTitle("⚠️ Login Session Already Active")
                .setDescription(
                    `A login session is already active.\n\n` +
                        `**Debug URL:** ${youtubeCookieManager.loginDebugUrl}\n\n` +
                        "Use `ytcookies cancel` to cancel it, or `ytcookies save` if you've completed login.",
                );

            await ctx.send({ embeds: [embed] });
            return;
        }

        const loadingEmbed = createEmbed("info")
            .setTitle("🔄 Starting Browser Session...")
            .setDescription("Please wait while the browser is being launched...");

        const msg = await ctx.send({ embeds: [loadingEmbed] });

        const portStr = process.env.BROWSER_DEBUG_PORT ?? "9222";
        const instructionsPortStr = process.env.BROWSER_INSTRUCTIONS_PORT ?? "9223";
        const debugPort = Number.parseInt(portStr, 10);
        const instructionsPort = Number.parseInt(instructionsPortStr, 10);

        // Validate port is within valid range
        if (Number.isNaN(debugPort) || debugPort < 1 || debugPort > 65535) {
            const errorEmbed = createEmbed("error")
                .setTitle("❌ Invalid Port Configuration")
                .setDescription(
                    `The configured BROWSER_DEBUG_PORT (${portStr}) is invalid.\n` +
                        "Please set a valid port number between 1 and 65535.",
                );
            await msg.edit({ embeds: [errorEmbed] });
            return;
        }

        if (Number.isNaN(instructionsPort) || instructionsPort < 1 || instructionsPort > 65535) {
            const errorEmbed = createEmbed("error")
                .setTitle("❌ Invalid Port Configuration")
                .setDescription(
                    `The configured BROWSER_INSTRUCTIONS_PORT (${instructionsPortStr}) is invalid.\n` +
                        "Please set a valid port number between 1 and 65535.",
                );
            await msg.edit({ embeds: [errorEmbed] });
            return;
        }

        const result = await youtubeCookieManager.startLoginSession(debugPort, instructionsPort);

        if (!result.success) {
            const errorEmbed = createEmbed("error")
                .setTitle("❌ Failed to Start Login Session")
                .setDescription(`Error: ${result.error}`);

            await msg.edit({ embeds: [errorEmbed] });
            return;
        }

        const successEmbed = createEmbed("success")
            .setTitle("🌐 Browser Session Started")
            .setDescription(
                "**Follow these steps to complete login:**\n\n" +
                    "1. Open Chrome/Chromium on your computer\n" +
                    "2. Go to `chrome://inspect`\n" +
                    `3. Click "Configure" and add: \`${process.env.PUBLIC_HOST || "your-server-ip"}:${debugPort}\`\n` +
                    '4. Click "inspect" under the Remote Target\n' +
                    "5. Complete the Google login in the opened window\n" +
                    "6. Once on YouTube homepage, run `ytcookies save`\n\n" +
                    `**Instructions page:** ${result.debugUrl}\n\n` +
                    "⚠️ **Use a throwaway Google account!**\n\n" +
                    "Session will auto-expire in 10 minutes.",
            );

        await msg.edit({ embeds: [successEmbed] });
    }

    private async saveCookies(ctx: CommandContext): Promise<void> {
        if (!youtubeCookieManager.hasActiveLoginSession) {
            const embed = createEmbed("error")
                .setTitle("❌ No Active Login Session")
                .setDescription(
                    "There's no active login session.\n\n" +
                        "Run `ytcookies login` first to start a browser session.",
                );

            await ctx.send({ embeds: [embed] });
            return;
        }

        const loadingEmbed = createEmbed("info")
            .setTitle("🔄 Saving Cookies...")
            .setDescription("Extracting cookies from the browser session...");

        const msg = await ctx.send({ embeds: [loadingEmbed] });

        const result = await youtubeCookieManager.saveLoginSessionCookies();

        if (!result.success) {
            const errorEmbed = createEmbed("error")
                .setTitle("❌ Failed to Save Cookies")
                .setDescription(`Error: ${result.error}`);

            await msg.edit({ embeds: [errorEmbed] });
            return;
        }

        const successEmbed = createEmbed("success")
            .setTitle("✅ Cookies Saved Successfully!")
            .setDescription(
                "YouTube cookies have been saved.\n\n" +
                    'The bot should now be able to play YouTube videos without "Sign in to confirm you\'re not a bot" errors.\n\n' +
                    "**Note:** If you experience issues later, run `ytcookies login` again to refresh the cookies.",
            );

        await msg.edit({ embeds: [successEmbed] });
    }

    private async cancelLogin(ctx: CommandContext): Promise<void> {
        if (!youtubeCookieManager.hasActiveLoginSession) {
            const embed = createEmbed("warn")
                .setTitle("⚠️ No Active Session")
                .setDescription("There's no active login session to cancel.");

            await ctx.send({ embeds: [embed] });
            return;
        }

        await youtubeCookieManager.cancelLoginSession();

        const embed = createEmbed("success")
            .setTitle("✅ Login Session Cancelled")
            .setDescription("The browser session has been closed.");

        await ctx.send({ embeds: [embed] });
    }

    private async clearCookies(ctx: CommandContext): Promise<void> {
        // Cancel any active session first
        if (youtubeCookieManager.hasActiveLoginSession) {
            await youtubeCookieManager.cancelLoginSession();
        }

        youtubeCookieManager.clearCookies();

        const embed = createEmbed("success")
            .setTitle("✅ Cookies Cleared")
            .setDescription(
                "All stored YouTube cookies have been deleted.\n\n" +
                    "Run `ytcookies login` to set up new cookies.",
            );

        await ctx.send({ embeds: [embed] });
    }
}
