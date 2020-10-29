import BaseCommand from "../structures/BaseCommand";
import { MessageEmbed } from "discord.js";
import type { IMessage } from "../../typings";
import type Jukebox from "../structures/Jukebox";

export default class NowPlayingCommand extends BaseCommand {
    public constructor(client: Jukebox, public readonly path: string) {
        super(client, path, {
            aliases: ["np", "now-playing"]
        }, {
            name: "nowplaying",
            description: "Send an info about the current playing song",
            usage: "{prefix}nowplaying"
        });
    }

    public execute(message: IMessage): any {
        if (!message.guild?.queue) return message.channel.send(new MessageEmbed().setDescription("There is nothing playing.").setColor("#FFFF00"));
        return message.channel.send(
            new MessageEmbed().setDescription(`${message.guild.queue.playing ? "▶ Now playing:" : "⏸ Now playing (paused):"} ` +
                `**[${message.guild.queue.songs.first()?.title as string}](${message.guild.queue.songs.first()?.url as string})**`)
                .setColor("#00FF00")
        );
    }
}
