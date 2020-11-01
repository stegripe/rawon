import BaseCommand from "../structures/BaseCommand";
import { MessageEmbed } from "discord.js";
import type Disc_11 from "../structures/Disc_11";
import type { IMessage } from "../../typings";

export default class StopCommand extends BaseCommand {
    public constructor(public client: Disc_11, public readonly path: string) {
        super(client, path, {
            aliases: ["leave", "disconnect", "dc"]
        }, {
            name: "stop",
            description: "Stop track and delete the queue",
            usage: "{prefix}stop"
        });
    }

    public execute(message: IMessage): any {
        if (!message.member?.voice.channel) return message.channel.send(new MessageEmbed().setDescription("You're not in a voice channel").setColor("YELLOW"));
        if (!message.guild?.queue) return message.channel.send(new MessageEmbed().setDescription("There is nothing playing.").setColor("YELLOW"));
        if (message.member.voice.channel.id !== message.guild.queue.voiceChannel?.id) {
            return message.channel.send(
                new MessageEmbed().setDescription("You need to be in the same voice channel as mine").setColor("RED")
            );
        }

        message.guild.queue.voiceChannel.leave();
        message.guild.queue = null;

        message.channel.send(new MessageEmbed().setDescription("⏹  **|**  The queue has been stopped.").setColor(this.client.config.embedColor))
            .catch(e => this.client.logger.error("STOP_CMD_ERR:", e));
    }
}
