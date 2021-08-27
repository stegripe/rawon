import { DefineCommand } from "../utils/decorators/DefineCommand";
import { BaseCommand } from "../structures/BaseCommand";
import { createEmbed } from "../utils/createEmbed";
import { Message, version } from "discord.js";
import { uptime as osUptime } from "os";

@DefineCommand({
    aliases: ["botinfo", "info", "stats"],
    description: "Send the information about the bot",
    name: "about",
    usage: "{prefix}about"
})
export class AboutCommand extends BaseCommand {
    public async execute(message: Message): Promise<void> {
        const opusEncoder = await this.client.util.getOpusEncoder();
        message.channel.send({
            embeds: [
                createEmbed("info", `
\`\`\`asciidoc
Users count        :: ${await this.client.util.getUsersCount()}
Channels count     :: ${await this.client.util.getChannelsCount()}
Guilds count       :: ${await this.client.util.getGuildsCount()}
Shards count       :: ${this.client.shard ? `${this.client.shard.count}` : "N/A"}
Shard ID           :: ${this.client.shard ? `${this.client.shard.ids[0]}` : "N/A"}
Playing Music on   :: ${await this.client.util.getTotalPlaying()} guilds

Platform           :: ${process.platform}
Arch               :: ${process.arch}
Memory (RSS)       :: ${this.client.util.bytesToSize(process.memoryUsage().rss)} 
Memory (Total)     :: ${this.client.util.bytesToSize(process.memoryUsage().heapTotal)}
Memory (Used)      :: ${this.client.util.bytesToSize(process.memoryUsage().heapUsed)}
Process Uptime     :: ${this.client.util.formatMS(process.uptime() * 1000)}
Bot Uptime         :: ${this.client.util.formatMS(this.client.uptime!)}
OS Uptime          :: ${this.client.util.formatMS(osUptime() * 1000)}

Node.js version    :: ${process.version}
Discord.js version :: v${version}
FFmpeg version     :: v${this.client.util.getFFmpegVersion()}
YTDL-Core version  :: v${(await this.client.util.getPackageJSON("ytdl-core")).version}
Opus Encoder       :: ${opusEncoder.pkgMetadata.name} v${opusEncoder.pkgMetadata.version}
Bot Version        :: v${(await this.client.util.getPackageJSON()).version}
Source code        :: https://github.com/zhycorp/disc-11
\`\`\`
        `).setAuthor(`${this.client.user?.username as string} - A simple Discord music bot`)
            ]
        }).catch(e => this.client.logger.error("ABOUT_CMD_ERR:", e));
    }
}
