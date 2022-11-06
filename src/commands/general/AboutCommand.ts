import { CommandContext } from "../../structures/CommandContext";
import { createEmbed } from "../../utils/functions/createEmbed";
import { createTable } from "../../utils/functions/createTable";
import { BaseCommand } from "../../structures/BaseCommand";
import { formatMS } from "../../utils/functions/formatMS";
import { Command } from "../../utils/decorators/Command";
import i18n from "../../config";
import { version as DJSVersion } from "discord.js";
import { readFileSync } from "fs";
import { uptime } from "os";

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
    public execute(ctx: CommandContext): void {
        const values = [
            [i18n.__("commands.general.about.osUptimeString"), formatMS(uptime() * 1000)],
            [i18n.__("commands.general.about.processUptimeString"), formatMS(process.uptime() * 1000)],
            [i18n.__("commands.general.about.botUptimeString"), formatMS(process.uptime() * 1000)],
            [""],
            [i18n.__("commands.general.about.nodeVersionString"), process.versions.node],
            [i18n.__("commands.general.about.discordJSVersionString"), DJSVersion],
            [i18n.__("commands.general.about.ffmpegVersionString"), this.client.utils.getFFmpegVersion()],
            [i18n.__("commands.general.about.botVersionString"), pkg.version],
            [""],
            [i18n.__("commands.general.about.sourceCodeString"), "https://github.com/Clytage/rawon"]
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
