import { createEmbed } from "#rawon/utils/functions/createEmbed.js";
import { BaseEvent } from "#rawon/structures/BaseEvent.js";
import { Event } from "#rawon/utils/decorators/Event.js";

import { Message, User } from "discord.js";

@Event("messageCreate")
export class MessageCreateEvent extends BaseEvent {
    public execute(message: Message): void {
        if (message.author.bot || message.channel.isDMBased()) return;

        if (message.content.startsWith(this.client.config.prefix)) return this.client.commands.handle(message);

        if (this.getUserFromMention(message.content)?.id === this.client.user!.id) {
            message
                .reply({
                    embeds: [
                        createEmbed(
                            "info",
                            `👋 **|** Hi ${message.author.toString()}, my prefix is **\`${
                                this.client.config.prefix
                            }\`**`
                        )
                    ]
                })
                .catch(e => this.client.logger.error("PROMISE_ERR:", e));
        }
    }

    private getUserFromMention(mention: string): User | undefined {
        const match = (/^<@!?(?<id>\d+)>$/).exec(mention);
        if (!match) return undefined;

        const id = match.groups!.id;
        return this.client.users.cache.get(id);
    }
}
