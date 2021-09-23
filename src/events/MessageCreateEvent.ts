import { DefineEvent } from "../utils/decorators/DefineEvent";
import { BaseEvent } from "../structures/BaseEvent";
import { createEmbed } from "../utils/createEmbed";
import { Message, User } from "discord.js";

@DefineEvent("messageCreate")
export class MessageCreateEvent extends BaseEvent {
    public async execute(message: Message): Promise<any> {
        if (message.author.bot || message.channel.type === "DM" || !this.client.commands.isReady) return message;

        if (message.content.startsWith(this.client.config.prefix)) return this.client.commands.handle(message);

        if ((await this.getUserFromMention(message.content))?.id === this.client.user?.id) {
            message.reply({ embeds: [createEmbed("info", `👋 **|** Hi ${message.author.toString()}, my prefix is **\`${this.client.config.prefix}\`**`)] }).catch(e => this.client.logger.error("PROMISE_ERR:", e));
        }
    }

    private getUserFromMention(mention: string): Promise<User | undefined> {
        const matches = /^<@!?(\d+)>$/.exec(mention);
        if (!matches) return Promise.resolve(undefined);

        const id = matches[1];
        return this.client.users.fetch(id);
    }
}
