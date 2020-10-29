import { MessageEmbed } from "discord.js";
import type { Snowflake } from "discord.js";
import type Jukebox from "../structures/Jukebox";
import type { IMessage, ClientEventListener } from "../../typings";

export default class MessageEvent implements ClientEventListener {
    public readonly name = "message";
    public constructor(private readonly client: Jukebox) {}

    public execute(message: IMessage): any {
        if (message.author.bot) return message;
        if (message.channel.type === "dm") return message;
        if (message.mentions.users.has(this.client.user?.id as Snowflake)) {
            return message.channel.send(
                new MessageEmbed().setDescription(`Hi, I'm a simple music bot, see my commands with \`${this.client.config.prefix}help\``).setColor("#00FF00")
            );
        }
        if (!message.content.toLowerCase().startsWith(this.client.config.prefix)) return message;
        return this.client.CommandsHandler.handle(message);
    }
}
