import { IMessage } from "../../typings";
import { DefineListener } from "../utils/decorators/DefineListener";
import { createEmbed } from "../utils/createEmbed";
import { BaseListener } from "../structures/BaseListener";

@DefineListener("message")
export class MessageEvent extends BaseListener {
    public execute(message: IMessage): any {
        if (message.author.bot) return message;
        if (message.channel.type === "dm") return message;
        if (message.content === message.guild?.me?.toString()) {
            return message.channel.send(
                createEmbed("info", `👋  **|**  Hi there, my prefix is **\`${this.client.config.prefix}\`**`)
            );
        }
        if (!message.content.toLowerCase().startsWith(this.client.config.prefix)) return message;
        return this.client.commands.handle(message);
    }
}
