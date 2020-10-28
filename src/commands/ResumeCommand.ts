import BaseCommand from "../structures/BaseCommand";
import { MessageEmbed } from "discord.js";
import type { IMessage } from "../../typings";
import type Disc_11 from "../structures/Disc_11";

export default class ResumeCommand extends BaseCommand {
    public constructor(client: Disc_11, public readonly path: string) {
        super(client, path, {}, {
            name: "resume",
            description: "Resume the paused music.",
            usage: "{prefix}resume"
        });
    }

    public execute(message: IMessage): any {
        if (!message.member?.voice.channel) return message.channel.send(new MessageEmbed().setDescription("Sorry, but you need to be in a voice channel to skip a music").setColor("RED"));
        if (!message.guild?.queue) return message.channel.send(new MessageEmbed().setDescription("There is nothing playing.").setColor("YELLOW"));
        if (message.member.voice.channel.id !== message.guild.queue.voiceChannel?.id) {
            return message.channel.send(
                new MessageEmbed().setDescription("You need to be in the same voice channel as mine").setColor("YELLOW")
            );
        }

        if (message.guild.queue.playing) {
            message.channel.send(new MessageEmbed().setDescription("Music is not paused!").setColor("YELLOW")).catch(e => this.client.logger.error("RESUME_CMD_ERR:", e));
        } else {
            message.guild.queue.playing = true;
            message.guild.queue.connection?.dispatcher.resume();
            message.channel.send(new MessageEmbed().setDescription("▶  **|**  Resumed the music for you").setColor(this.client.config.embedColor)).catch(e => this.client.logger.error("RESUME_CMD_ERR:", e));
        }
    }
}
