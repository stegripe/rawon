import BaseCommand from "../structures/BaseCommand";
import { MessageEmbed } from "discord.js";
import type Jukebox from "../structures/Disc_11";
import type { IMessage } from "../../typings";

export default class StopCommand extends BaseCommand {
    public constructor(public client: Jukebox, public readonly path: string) {
        super(client, path, {}, {
            name: "stop",
            description: "Stop the current queue",
            usage: "{prefix}stop"
        });
    }

    public execute(message: IMessage): any {
        if (!message.member?.voice.channel) return message.channel.send(new MessageEmbed().setDescription("You're not in a voice channel").setColor("#FFFF00"));
        if (!message.guild?.queue) return message.channel.send(new MessageEmbed().setDescription("There is nothing playing.").setColor("#FFFF00"));
        if (message.member.voice.channel.id !== message.guild.queue.voiceChannel?.id) {
            return message.channel.send(
                new MessageEmbed().setDescription("You need to be in the same voice channel as mine").setColor("#FF0000")
            );
        }

        message.guild.queue.playing = true;
        message.guild.queue.connection?.dispatcher.resume();
        message.guild.queue.songs.clear();
        message.guild.queue.connection?.dispatcher.end();

        message.channel.send(new MessageEmbed().setDescription("⏹ Stopping the queue...").setColor("#00FF00"))
            .catch(e => this.client.logger.error("STOP_CMD_ERR:", e));
    }
}
