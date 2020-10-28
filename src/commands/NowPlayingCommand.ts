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
            description: "Send an title about the current track.",
            usage: "{prefix}nowplaying"
        });
    }

    public execute(message: IMessage): any {
        if (!message.guild?.queue) return message.channel.send(new MessageEmbed().setDescription("There is nothing playing.").setColor("YELLOW"));
        return message.channel.send(
            new MessageEmbed().setDescription(`Now playing: **[${message.guild.queue.songs.first()!.title}](${message.guild.queue.songs.first()!.url})**`)
                .setColor(this.client.config.embedColor)
        );
    }
}
