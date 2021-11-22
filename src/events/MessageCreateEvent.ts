import { BaseEvent } from "../structures/BaseEvent";
import { createEmbed } from "../utils/createEmbed";
import i18n from "../config";
import { Message, User } from "discord.js";

export class MessageCreateEvent extends BaseEvent {
    public constructor(client: BaseEvent["client"]) {
        super(client, "messageCreate");
    }

    public async execute(message: Message): Promise<Message|void> {
        if (message.author.bot || message.channel.type === "DM" || !this.client.commands.isReady) return message;

        if (this.getUserFromMention(message.content)?.id === this.client.user?.id) {
            message.reply({ embeds: [createEmbed("info", `👋 **|** ${i18n.__mf("events.createMessage", { author: message.author.toString(), prefix: `\`${this.client.config.mainPrefix}\`` })}`)] }).catch(e => this.client.logger.error("PROMISE_ERR:", e));
        }

        const pref = this.client.config.altPrefixes.concat(this.client.config.mainPrefix).find(p => {
            if (p === "{mention}") {
                const userMention = /<@(!)?\d*?>/.exec(message.content);
                if (userMention?.index !== 0) return false;

                const user = this.getUserFromMention(userMention[0]);

                return user?.id === this.client.user?.id;
            }

            return message.content.startsWith(p);
        });
        if (pref) return this.client.commands.handle(message, pref);
    }

    private getUserFromMention(mention: string): User | undefined {
        const matches = /^<@!?(\d+)>$/.exec(mention);
        if (!matches) return undefined;

        const id = matches[1];
        return this.client.users.cache.get(id);
    }
}
