import BaseCommand from "../structures/BaseCommand";
import { MessageEmbed } from "discord.js";
import type { IMessage } from "../../typings";
import type Disc_11 from "../structures/Disc_11";

export default class RepeatCommand extends BaseCommand {
    public constructor(public client: Disc_11, public readonly path: string) {
        super(client, path, {
            aliases: ["loop", "music-repeat", "music-loop"]
        }, {
            name: "repeat",
            description: "Repeat the current track or queue",
            usage: "{prefix}repeat <all | one | disable>"
        });
    }

    public execute(message: IMessage, args: string[]): any {
        const mode = args[0];
        if (!message.member?.voice.channel) return message.channel.send(new MessageEmbed().setDescription("You're not in a voice channel").setColor("YELLOW"));
        if (!message.guild?.queue) return message.channel.send(new MessageEmbed().setDescription("There is nothing playing.").setColor("YELLOW"));
        if (message.member.voice.channel.id !== message.guild.queue.voiceChannel?.id) {
            return message.channel.send(
                new MessageEmbed().setDescription("You need to be in the same voice channel as mine").setColor("RED")
            );
        }
        if (mode === "all" || mode === "queue" || mode === "*" || mode === "2") {
            message.guild.queue.loopMode = 2;
            return message.channel.send(new MessageEmbed().setDescription("🔁  **|**  Repeating all music in the queue").setColor(this.client.config.embedColor));
        } else if (mode === "current" || mode === "one" || mode === "musiconly" || mode === "1") {
            message.guild.queue.loopMode = 1;
            return message.channel.send(new MessageEmbed().setDescription("🔂  **|**  Repeating this music only").setColor(this.client.config.embedColor));
        } else if (mode === "disable" || mode === "off" || mode === "0") {
            message.guild.queue.loopMode = 0;
            return message.channel.send(new MessageEmbed().setDescription("▶  **|**  Repeating disabled.").setColor(this.client.config.embedColor));
        }
        message.channel.send(`Invalid value, see **\`${this.client.config.prefix}help ${this.help.name}\`** for more information!`).catch(e => this.client.logger.error("REPEAT_CMD_ERR:", e));
    }
}
