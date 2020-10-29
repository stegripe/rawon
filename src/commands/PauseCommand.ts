import BaseCommand from "../structures/BaseCommand";
import { MessageEmbed } from "discord.js";
import type { IMessage } from "../../typings";
import type Jukebox from "../structures/Disc_11";

export default class PauseCommand extends BaseCommand {
    public constructor(client: Jukebox, public readonly path: string) {
        super(client, path, {}, {
            name: "pause",
            description: "Pause the current song.",
            usage: "{prefix}pause"
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

        if (message.guild.queue.playing) {
            message.guild.queue.playing = false;
            message.guild.queue.connection?.dispatcher.pause();
            return message.channel.send(new MessageEmbed().setDescription("⏸ Paused the music for you!").setColor("#00FF00"));
        }
        message.channel.send(new MessageEmbed().setDescription("❗ Music is already paused!").setColor("#FFFF00"))
            .catch(e => this.client.logger.error("PAUSE_CMD_ERR:", e));
    }
}
