import BaseCommand from "../structures/BaseCommand";
import { MessageEmbed } from "discord.js";
import type { IMessage } from "../../typings";
import type Jukebox from "../structures/Disc_11";

export default class VolumeCommand extends BaseCommand {
    public constructor(public client: Jukebox, public readonly path: string) {
        super(client, path, {}, {
            name: "volume",
            description: "Show or change the music volume",
            usage: "{prefix}volume [new volume]"
        });
    }

    public execute(message: IMessage, args: string[]): any {
        let volume = Number(args[0]);
        if (!message.member?.voice.channel) return message.channel.send(new MessageEmbed().setDescription("You're not in a voice channel").setColor("#FFFF00"));
        if (!message.guild?.queue) return message.channel.send(new MessageEmbed().setDescription("There is nothing playing.").setColor("#FFFF00"));
        if (message.member.voice.channel.id !== message.guild.queue.voiceChannel?.id) {
            return message.channel.send(
                new MessageEmbed().setDescription("You need to be in the same voice channel as mine").setColor("#FF0000")
            );
        }

        if (isNaN(volume)) return message.channel.send(new MessageEmbed().setDescription(`📶 The current volume is ${message.guild.queue.volume}`).setColor("#00FF00"));

        if (volume < 0) volume = 0;
        if (volume === 0) return message.channel.send(new MessageEmbed().setDescription("❗ Please pause the music instead of setting the volume to 0").setColor("#FFFF00"));
        if (Number(args[0]) > this.client.config.maxVolume) {
            return message.channel.send(
                new MessageEmbed().setDescription(`❗ Can't set the volume above ${this.client.config.maxVolume}`).setColor("#FFFF00")
            );
        }

        message.guild.queue.volume = Number(args[0]);
        message.guild.queue.connection?.dispatcher.setVolume(Number(args[0]) / this.client.config.maxVolume);
        message.channel.send(new MessageEmbed().setDescription(`📶 Volume set to ${args[0]}`).setColor("#00FF00")).catch(console.error);
    }
}
