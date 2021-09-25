import { DefineCommand } from "../../utils/decorators/DefineCommand";
import { CommandContext } from "../../structures/CommandContext";
import { BaseCommand } from "../../structures/BaseCommand";
import { createEmbed } from "../../utils/createEmbed";
import { formatMS } from "../../utils/formatMS";
import { version as FFmpegVersion } from "ffmpeg-static/package.json";
import { version as BotVersion } from "../../../package.json";
import { version as DJSVersion } from "discord.js";
import { uptime } from "os";

@DefineCommand({
    aliases: ["botinfo", "info", "information", "stats"],
    description: "Show the bot's information",
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
OS Uptime           ::  ${formatMS(uptime() * 1000)}
Process Uptime      ::  ${formatMS(process.uptime() * 1000)}
Bot Uptime          ::  ${formatMS(this.client.uptime!)}

Node.js version     ::  ${process.version}
Discord.js version  ::  ${DJSVersion}
FFmpeg version      ::  ${FFmpegVersion}
Bot version         ::  ${BotVersion}

Source code         ::  https://github.com/zhycorp/disc-11
\`\`\`
                `)
                    .setAuthor(`${this.client.user?.username as string} - Bot Information`)
            ]
        }).catch(e => this.client.logger.error("ABOUT_CMD_ERR:", e));
    }
}
