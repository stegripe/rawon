import { readFileSync } from "node:fs";
import { uptime } from "node:os";
import process from "node:process";
import { URL } from "node:url";
import { version as DJSVersion } from "discord.js";
import i18n from "../../config/index.js";
import { BaseCommand } from "../../structures/BaseCommand.js";
import { CommandContext } from "../../structures/CommandContext.js";
import { Command } from "../../utils/decorators/Command.js";
import { createEmbed } from "../../utils/functions/createEmbed.js";
import { createTable } from "../../utils/functions/createTable.js";
import { formatMS } from "../../utils/functions/formatMS.js";

const pkg = JSON.parse(
    readFileSync(new URL("../../../package.json", import.meta.url)).toString()
) as { version: string };

@Command({
    aliases: ["information", "info", "botinfo", "stats"],
    description: i18n.__("commands.general.about.description"),
    name: "about",
    slash: {
        options: []
    },
    usage: "{prefix}about"
})
export class AboutCommand extends BaseCommand {
    public async execute(ctx: CommandContext): Promise<void> {
        const values = [
            [i18n.__("commands.general.about.osUptimeString"), formatMS(uptime() * 1_000)],
            [i18n.__("commands.general.about.processUptimeString"), formatMS(process.uptime() * 1_000)],
            [i18n.__("commands.general.about.botUptimeString"), formatMS(process.uptime() * 1_000)],
            [""],
            [i18n.__("commands.general.about.cachedUsersString"), `${await this.client.utils.getUserCount()}`],
            [i18n.__("commands.general.about.channelsString"), `${await this.client.utils.getChannelCount()}`],
            [i18n.__("commands.general.about.serversString"), `${await this.client.utils.getGuildCount()}`],
            [""],
            [i18n.__("commands.general.about.nodeVersionString"), process.versions.node],
            [i18n.__("commands.general.about.discordJSVersionString"), DJSVersion],
            [i18n.__("commands.general.about.ffmpegVersionString"), this.client.utils.getFFmpegVersion()],
            [i18n.__("commands.general.about.botVersionString"), pkg.version],
            [""],
            [i18n.__("commands.general.about.sourceCodeString"), "GitHub.com/PixlGalaxy/Pixl"]
        ];
        const value = createTable(values);

        await ctx
            .reply({
                embeds: [
                    createEmbed("info", `\`\`\`asciidoc\n${value}\n\`\`\``).setAuthor({
                        name: i18n.__mf("commands.general.about.aboutFooter", {
                            botname: this.client.user?.username ?? "PIXL"
                        })
                    })
                ]
            })
            .catch((error: unknown) => this.client.logger.error("ABOUT_CMD_ERR:", error));
    }
}
