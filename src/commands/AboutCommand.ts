import { BaseCommand } from "../structures/BaseCommand";
import { version } from "discord.js";
import { uptime as osUptime } from "os";
import path from "path";
import { formatMS } from "../utils/formatMS";
import { IMessage } from "../../typings";
import { DefineCommand } from "../utils/decorators/DefineCommand";
import { createEmbed } from "../utils/createEmbed";

@DefineCommand({
    aliases: ["botinfo", "info", "stats"],
    name: "about",
    description: "Send the bot information",
    usage: "{prefix}about"
})
export class AboutCommand extends BaseCommand {
    public async execute(message: IMessage): Promise<void> {
        message.channel.send(
            createEmbed("info", `
\`\`\`asciidoc
Users count         :: ${await this.client.getUsersCount()}
Channels count      :: ${await this.client.getChannelsCount()}
Guilds count        :: ${await this.client.getGuildsCount()}
Shards count        :: ${this.client.shard ? `${this.client.shard.count}` : "N/A"}
Shard ID            :: ${this.client.shard ? `${this.client.shard.ids[0]}` : "N/A"}
Playing music on    :: ${await this.client.getTotalPlaying()} guilds

Platform            :: ${process.platform}
Arch                :: ${process.arch}
Memory              :: ${this.bytesToSize(await this.client.getTotalMemory("rss"))}
OS uptime           :: ${formatMS(osUptime() * 1000)}
Process uptime      :: ${formatMS(process.uptime() * 1000)}
Bot uptime          :: ${formatMS(this.client.uptime!)}

Node.JS version     :: ${process.version}
Discord.JS version  :: v${version}
Bot version         :: v${(await import(path.join(process.cwd(), "package.json"))).version}

Source code         :: https://github.com/zhycorp/disc-11
Get a support       :: https://zhycorp.com/discord
\`\`\`
        `)
                .setAuthor(`${this.client.user?.username as string} - A simple open-sourced Discord music bot`)
        ).catch(e => this.client.logger.error("ABOUT_CMD_ERR:", e));
    }

    private bytesToSize(bytes: number): string { // Function rrom Rendang's util (https://github.com/Hazmi35/rendang)
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
