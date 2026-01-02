import { readFileSync } from "node:fs";
import { uptime } from "node:os";
import process from "node:process";
import { URL } from "node:url";
import { version as DjsVersion } from "discord.js";
import i18n from "../../config/index.js";
import { BaseCommand } from "../../structures/BaseCommand.js";
import { type CommandContext } from "../../structures/CommandContext.js";
import { Command } from "../../utils/decorators/Command.js";
import { createEmbed } from "../../utils/functions/createEmbed.js";
import { createTable } from "../../utils/functions/createTable.js";
import { formatMS } from "../../utils/functions/formatMS.js";
import { i18n__, i18n__mf } from "../../utils/functions/i18n.js";

const pkg = JSON.parse(
    readFileSync(new URL("../../../package.json", import.meta.url)).toString(),
) as { version: string };

@Command({
    aliases: ["information", "info", "botinfo", "stats"],
    description: i18n.__("commands.general.about.description"),
    name: "about",
    slash: {
        options: [],
    },
    usage: "{prefix}about",
})
export class AboutCommand extends BaseCommand {
    public async execute(ctx: CommandContext): Promise<void> {
        const __ = i18n__(this.client, ctx.guild);
        const __mf = i18n__mf(this.client, ctx.guild);

        const values = [
            [__("commands.general.about.osUptimeString"), formatMS(uptime() * 1_000)],
            [__("commands.general.about.processUptimeString"), formatMS(process.uptime() * 1_000)],
            [__("commands.general.about.botUptimeString"), formatMS(process.uptime() * 1_000)],
            [""],
            [
                __("commands.general.about.cachedUsersString"),
                `${await this.client.utils.getUserCount()}`,
            ],
            [
                __("commands.general.about.channelsString"),
                `${await this.client.utils.getChannelCount()}`,
            ],
            [
                __("commands.general.about.serversString"),
                `${await this.client.utils.getGuildCount()}`,
            ],
            [""],
            [__("commands.general.about.nodeVersionString"), process.versions.node],
            [__("commands.general.about.discordJSVersionString"), DjsVersion],
            [
                __("commands.general.about.ffmpegVersionString"),
                this.client.utils.getFFmpegVersion(),
            ],
            [__("commands.general.about.botVersionString"), pkg.version],
            [__("commands.general.about.commitString"), this.client.utils.getCommitHash("HEAD")],
            [""],
            [__("commands.general.about.sourceCodeString"), "https://github.com/stegripe/rawon"],
        ];
        const value = createTable(values);

        await ctx
            .reply({
                embeds: [
                    createEmbed("info", `\`\`\`asciidoc\n${value}\n\`\`\``).setAuthor({
                        name: __mf("commands.general.about.aboutFooter", {
                            botname: this.client.user?.username ?? "Unknown",
                        }),
                    }),
                ],
            })
            .catch((error: unknown) => this.client.logger.error("ABOUT_CMD_ERR:", error));
    }
}
