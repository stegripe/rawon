import { MessageEmbed } from "discord.js";
import Disc_11 from "../structures/Disc_11";
import { IMessage, ClientEventListener } from "../../typings";
import { DefineListener } from "../utils/decorators/DefineListener";

@DefineListener("message")
export default class MessageEvent implements ClientEventListener {
    public constructor(private readonly client: Disc_11, public name: ClientEventListener["name"]) {}

    public execute(message: IMessage): any {
        if (message.author.bot) return message;
        if (message.channel.type === "dm") return message;
        if (message.content === message.guild?.me?.toString()) {
            return message.channel.send(
                new MessageEmbed().setDescription(`👋 Hi there, my prefix is **\`${this.client.config.prefix}\`**`).setColor(this.client.config.embedColor)
            );
        }
        if (!message.content.toLowerCase().startsWith(this.client.config.prefix)) return message;
        return this.client.CommandsHandler.handle(message);
    }
}
