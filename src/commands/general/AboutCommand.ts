import { CommandContext } from "../../structures/CommandContext";
import { version as BotVersion } from "../../../package.json";
import { BaseCommand } from "../../structures/BaseCommand";
import { createEmbed } from "../../utils/createEmbed";
import { formatMS } from "../../utils/formatMS";
import i18n from "../../config";
import { version as DJSVersion } from "discord.js";
import { uptime } from "os";

export class AboutCommand extends BaseCommand {
    public constructor(client: BaseCommand["client"]) {
        super(client, {
            aliases: ["information", "info", "botinfo", "stats"],
            description: i18n.__("commands.general.about.description"),
            name: "about",
            slash: {
                options: []
            },
            usage: "{prefix}about"
        });
    }

    public execute(ctx: CommandContext): void {
        const values = [
            [i18n.__("commands.general.about.osUptimeString"), formatMS(uptime() * 1000)],
            [i18n.__("commands.general.about.processUptimeString"), formatMS(process.uptime() * 1000)],
            [i18n.__("commands.general.about.botUptimeString"), formatMS(process.uptime() * 1000)],
            [""],
            [i18n.__("commands.general.about.nodeVersionString"), process.versions.node],
            [i18n.__("commands.general.about.discordJSVersionString"), DJSVersion],
            [i18n.__("commands.general.about.ffmpegVersionString"), this.client.utils.getFFmpegVersion()],
            [i18n.__("commands.general.about.botVersionString"), BotVersion],
            [""],
            [i18n.__("commands.general.about.sourceCodeString"), "https://github.com/zhycorp/disc-11"]
        ];
        const value = values.map(x => `${x.map((y, i) => {
            const sortingArr = [...values];

            return `${y}${" ".repeat(sortingArr.sort((a, b) => (b[i] ?? "").length - (a[i] ?? "").length)[0][i].length - y.length)}`;
        }).join("   ::   ")}`).join("\n");

        void ctx.reply({
            embeds: [
                createEmbed("info", `
\`\`\`asciidoc
${value}
\`\`\`
                `)
                    .setAuthor(i18n.__mf("commands.general.about.aboutFooter", { botname: this.client.user?.username as string }))
            ]
        }).catch(e => this.client.logger.error("ABOUT_CMD_ERR:", e));
    }
}
