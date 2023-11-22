import { CommandContext } from "../../structures/CommandContext.js";
import { createEmbed } from "../../utils/functions/createEmbed.js";
import { createTable } from "../../utils/functions/createTable.js";
import { BaseCommand } from "../../structures/BaseCommand.js";
import { formatMS } from "../../utils/functions/formatMS.js";
import { Command } from "../../utils/decorators/Command.js";
import i18n from "../../config/index.js";
import { version as DJSVersion } from "discord.js";
import { readFileSync } from "node:fs";
import { uptime } from "node:os";

const pkg: { version: string } = JSON.parse(
    readFileSync(new URL("../../../package.json", import.meta.url)).toString()
);

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
            [i18n.__("commands.general.about.osUptimeString"), formatMS(uptime() * 1000)],
            [i18n.__("commands.general.about.processUptimeString"), formatMS(process.uptime() * 1000)],
            [i18n.__("commands.general.about.botUptimeString"), formatMS(process.uptime() * 1000)],
            [""],
            [i18n.__("commands.general.about.cachedUsersString"), `${await this.client.utils.getUserCount()}`],
            [i18n.__("commands.general.about.channelsString"), `${await this.client.utils.getChannelCount()}`],
            [i18n.__("commands.general.about.serversString"), `${await this.client.utils.getGuildCount()}`],
            [""],
            [i18n.__("commands.general.about.nodeVersionString"), process.versions.node],
            [i18n.__("commands.general.about.discordJSVersionString"), DJSVersion],
            [i18n.__("commands.general.about.ffmpegVersionString"), this.client.utils.getFFmpegVersion()],
            [i18n.__("commands.general.about.botVersionString"), pkg.version],
            [i18n.__("commands.general.about.commitString"), this.client.utils.getCommitHash("HEAD")],
            [""],
            [i18n.__("commands.general.about.sourceCodeString"), "https://github.com/stegripe/rawon"]
        ];
        const value = createTable(values);

        void ctx
            .reply({
                embeds: [
                    createEmbed("info", `\`\`\`asciidoc\n${value}\n\`\`\``).setAuthor({
                        name: i18n.__mf("commands.general.about.aboutFooter", {
                            botname: this.client.user?.username ?? "Unknown"
                        })
                    })
                ]
            })
            .catch(e => this.client.logger.error("ABOUT_CMD_ERR:", e));
    }
}
