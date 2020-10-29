import BaseCommand from "../structures/BaseCommand";
import { MessageEmbed } from "discord.js";
import type { IMessage } from "../../typings";
import type Disc_11 from "../structures/Disc_11";

export default class NowPlayingCommand extends BaseCommand {
    public constructor(client: Disc_11, public readonly path: string) {
        super(client, path, {
            aliases: ["np", "now-playing"]
        }, {
            name: "nowplaying",
            description: "Send an information about the track",
            usage: "{prefix}nowplaying"
        });
    }

    public execute(message: IMessage): any {
        if (!message.guild?.queue) return message.channel.send(new MessageEmbed().setDescription("There is nothing playing.").setColor("YELLOW"));
        return message.channel.send(
            new MessageEmbed().setDescription(`${message.guild.queue.playing ? "▶  **|**  Now playing:" : "⏸  **|**  Now playing (paused):"} ` +
                `**[${message.guild.queue.songs.first()?.title as string}](${message.guild.queue.songs.first()?.url as string})**`)
                .setColor(this.client.config.embedColor)
        );
    }
}
