import { DefineListener } from "../utils/decorators/DefineListener";
import { BaseListener } from "../structures/BaseListener";
import { createEmbed } from "../utils/createEmbed";
import { Message } from "discord.js";

@DefineListener("messageCreate")
export class MessageCreateEvent extends BaseListener {
    public async execute(message: Message): Promise<any> {
        if (message.author.bot || message.channel.type !== "GUILD_TEXT") return message;

        if (message.content.toLowerCase().startsWith(this.client.config.prefix)) return this.client.commands.handle(message);

        if ((await this.client.util.getUserFromMention(message.content))?.id === message.client.user?.id) {
            return message.channel.send({
                embeds: [createEmbed("info", `👋 Hi, my name is **${this.client.user!.username}** a simple Discord music bot, use **\`${this.client.config.prefix}help\`** to have a look at my commands`)]
            });
        }
    }
}
