import { DefineCommand } from "../../utils/decorators/DefineCommand";
import { CommandContext } from "../../structures/CommandContext";
import { version as BotVersion } from "../../../package.json";
import { BaseCommand } from "../../structures/BaseCommand";
import { createEmbed } from "../../utils/createEmbed";
import { formatMS } from "../../utils/formatMS";
import i18n from "../../config";
import { version as FFmpegVersion } from "ffmpeg-static/package.json";
import { version as DJSVersion } from "discord.js";
import { uptime } from "os";
import Table from "cli-table";

const table = new Table({
    chars: {
        bottom: "", "bottom-left": "", "bottom-mid": "", "bottom-right": "",
        left: "", "left-mid": "",
        mid: "", "mid-mid": "", middle: "   ::   ",
        right: "", "right-mid": "",
        top: "", "top-left": "", "top-mid": "", "top-right": ""
    },
    style: { "padding-left": 0, "padding-right": 0 }
});

table.push(
    [i18n.__("commands.general.about.osUptimeString"), formatMS(uptime() * 1000)],
    [i18n.__("commands.general.about.processUptimeString"), formatMS(process.uptime() * 1000)],
    [i18n.__("commands.general.about.botUptimeString"), formatMS(process.uptime() * 1000)],
    [""],
    [i18n.__("commands.general.about.nodeVersionString"), process.version],
    [i18n.__("commands.general.about.discordJSVersionString"), DJSVersion],
    [i18n.__("commands.general.about.ffmpegVersionString"), FFmpegVersion],
    [i18n.__("commands.general.about.botVersionString"), BotVersion],
    [""],
    [i18n.__("commands.general.about.sourceCodeString"), "https://github.com/zhycorp/disc-11"]
);

@DefineCommand({
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
        void ctx.reply({
            embeds: [
                createEmbed("info", `
\`\`\`asciidoc
${table.toString()}
\`\`\`
                `)
                    .setAuthor(i18n.__mf("commands.general.about.aboutFooter", { botname: this.client.user?.username as string }))
            ]
        }).catch(e => this.client.logger.error("ABOUT_CMD_ERR:", e));
    }
}
