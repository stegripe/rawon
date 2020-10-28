import BaseCommand from "../structures/BaseCommand";
import { MessageEmbed } from "discord.js";
import type Disc_11 from "../structures/Disc_11";
import type { IMessage } from "../../typings";

export default class SkipCommand extends BaseCommand {
    public constructor(public client: Disc_11, public readonly path: string) {
        super(client, path, {}, {
            name: "skip",
            description: "Skip the track.",
            usage: "{prefix}skip"
        });
    }

    public execute(message: IMessage): any {
        if (!message.member?.voice.channel) return message.channel.send(new MessageEmbed().setDescription("Sorry, but you need to be in a voice channel to skip a music").setColor("RED"));
        if (!message.guild?.queue) return message.channel.send(new MessageEmbed().setDescription("There is nothing playing.").setColor("YELLOW"));
        if (message.member.voice.channel.id !== message.guild.queue.voiceChannel?.id) {
            return message.channel.send(
                new MessageEmbed().setDescription("You need to be in the same voice channel as mine").setColor("RED")
            );
        }

        message.guild.queue.playing = true;
        message.guild.queue.connection?.dispatcher.resume();
        message.guild.queue.connection?.dispatcher.end();

        message.channel.send(new MessageEmbed().setDescription(`⏭️  **|**  Skipped **[${message.guild.queue.songs.first()!.title}](${message.guild.queue.songs.first()!.url})**`).setColor(this.client.config.embedColor))
            .catch(e => this.client.logger.error("SKIP_CMD_ERR:", e));
    }
}
