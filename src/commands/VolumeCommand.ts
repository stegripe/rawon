import BaseCommand from "../structures/BaseCommand";
import { MessageEmbed } from "discord.js";
import type { IMessage } from "../../typings";
import type Disc_11 from "../structures/Disc_11";

export default class VolumeCommand extends BaseCommand {
    public constructor(public client: Disc_11, public readonly path: string) {
        super(client, path, {
            aliases: ["vol", "v"]
        }, {
            name: "volume",
            description: "Show or change the track volume",
            usage: "{prefix}volume [new volume]"
        });
    }

    public execute(message: IMessage, args: string[]): any {
        let volume = Number(args[0]);
        if (!message.member?.voice.channel) return message.channel.send(new MessageEmbed().setDescription("You're not in a voice channel").setColor("YELLOW"));
        if (!message.guild?.queue) return message.channel.send(new MessageEmbed().setDescription("There is nothing playing.").setColor("YELLOW"));
        if (message.member.voice.channel.id !== message.guild.queue.voiceChannel?.id) {
            return message.channel.send(
                new MessageEmbed().setDescription("You need to be in the same voice channel as mine").setColor("RED")
            );
        }

        if (isNaN(volume)) return message.channel.send(new MessageEmbed().setDescription(`🔊  **|**  The current volume is **\`${message.guild.queue.volume}\`**`).setColor(this.client.config.embedColor));

        if (volume < 0) volume = 0;
        if (volume === 0) return message.channel.send(new MessageEmbed().setDescription("Please pause the music instead of setting the volume to **\`0\`**").setColor("YELLOW"));
        if (Number(args[0]) > this.client.config.maxVolume) {
            return message.channel.send(
                new MessageEmbed().setDescription(`I can't set the volume above **\`${this.client.config.maxVolume}\`**`).setColor("YELLOW")
            );
        }

        message.guild.queue.volume = Number(args[0]);
        message.guild.queue.connection?.dispatcher.setVolume(Number(args[0]) / this.client.config.maxVolume);
        message.channel.send(new MessageEmbed().setDescription(`🔊  **|**  Volume set to **\`${args[0]}\`**`).setColor(this.client.config.embedColor)).catch(console.error);
    }
}
