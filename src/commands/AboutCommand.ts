import BaseCommand from "../structures/BaseCommand";
import { MessageEmbed, version } from "discord.js";
import { uptime as osUptime } from "os";
import path from "path";
import { formatMS } from "../utils/formatMS";
import type Jukebox from "../structures/Jukebox";
import type { IMessage } from "../../typings";

export default class AboutCommand extends BaseCommand {
    public constructor(public client: Jukebox, public readonly path: string) {
        super(client, path, { aliases: ["botinfo", "info", "stats"] }, {
            name: "about",
            description: "Send the bot's info",
            usage: "{prefix}about"
        });
    }

    public async execute(message: IMessage): Promise<void> {
        message.channel.send(new MessageEmbed()
            .setAuthor(`${this.client.user?.username as string} - Just a simple Discord music bot.`)
            .setDescription(`
\`\`\`asciidoc
Users count         :: ${await this.client.getUsersCount()}
Channels count      :: ${await this.client.getChannelsCount()}
Guilds count        :: ${await this.client.getGuildsCount()}
Shards count        :: ${this.client.shard ? `${this.client.shard.count}` : "N/A"}
Shard ID            :: ${this.client.shard ? `${this.client.shard.ids[0]}` : "N/A"}
Playing Music on    :: ${await this.client.getTotalPlaying()} guilds

Platform            :: ${process.platform}
Arch                :: ${process.arch}
OS Uptime           :: ${formatMS(osUptime() * 1000)}
Memory              :: ${this.bytesToSize(await this.client.getTotalMemory("rss"))}
Process Uptime      :: ${formatMS(process.uptime() * 1000)}
Bot Uptime          :: ${formatMS(this.client.uptime!)}

NodeJS version      :: ${process.version}
DiscordJS version   :: v${version}
Bot Version         :: v${(await import(path.join(process.cwd(), "package.json"))).version}

Source code         :: https://sh.hzmi.xyz/jukebox
\`\`\`
    `)
            .setColor("#00FF00")
            .setTimestamp()).catch(e => this.client.logger.error("ABOUT_CMD_ERR:", e));
    }

    private bytesToSize(bytes: number): string { // Function From Rendang's util (https://github.com/Hazmi35/rendang)
        if (isNaN(bytes) && bytes !== 0) throw new Error(`[bytesToSize] (bytes) Error: bytes is not a Number/Integer, received: ${typeof bytes}`);
        const sizes: string[] = ["B", "KiB", "MiB", "GiB", "TiB", "PiB"];
        if (bytes < 2 && bytes > 0) return `${bytes} Byte`;
        const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)).toString(), 10);
        if (i === 0) return `${bytes} ${sizes[i]}`;
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (sizes[i] === undefined) return `${bytes} ${sizes[sizes.length - 1]}`;
        return `${Number(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
    }
}
