import { MessageEmbed } from "discord.js";
import type Disc_11 from "../structures/Disc_11";
import type { IMessage, ClientEventListener } from "../../typings";

export default class MessageEvent implements ClientEventListener {
    public readonly name = "message";
    public constructor(private readonly client: Disc_11) {}

    public execute(message: IMessage): any {
        if (message.author.bot) return message;
        if (message.channel.type === "dm") return message;
        if (message.content === this.client.user?.toString()) {
            return message.channel.send(
                new MessageEmbed().setDescription(`👋 Hi there, my prefix is **\`${this.client.config.prefix}\`**`).setColor(this.client.config.embedColor)
            );
        }
        if (!message.content.toLowerCase().startsWith(this.client.config.prefix)) return message;
        return this.client.CommandsHandler.handle(message);
    }
}
