/* eslint-disable prefer-named-capture-group */
import { ChannelType, Message, User } from "discord.js";
import i18n from "../config/index.js";
import { BaseEvent } from "../structures/BaseEvent.js";
import { Event } from "../utils/decorators/Event.js";
import { createEmbed } from "../utils/functions/createEmbed.js";

@Event<typeof MessageCreateEvent>("messageCreate")
export class MessageCreateEvent extends BaseEvent {
    public async execute(message: Message): Promise<void> {
        this.client.debugLog.logData("info", "MESSAGE_CREATE", [
            ["ID", message.id],
            ["Guild", message.guild ? `${message.guild.name}(${message.guild.id})` : "DM"],
            [
                "Channel",
                message.channel.type === ChannelType.DM ? "DM" : `${message.channel.name}(${message.channel.id})`
            ],
            ["Author", `${message.author.tag}(${message.author.id})`]
        ]);

        if (message.author.bot || message.channel.type === ChannelType.DM || !this.client.commands.isReady) return;

        if (this.getUserFromMention(message.content)?.id === this.client.user?.id) {
            await message
                .reply({
                    embeds: [
                        createEmbed(
                            "info",
                            `👋 **|** ${i18n.__mf("events.createMessage", {
                                author: message.author.toString(),
                                prefix: `\`${this.client.config.mainPrefix}\``
                            })}`
                        )
                    ]
                })
                .catch((error: unknown) => this.client.logger.error("PROMISE_ERR:", error));
        }

        const pref = [...this.client.config.altPrefixes, this.client.config.mainPrefix].find(pr => {
            if (pr === "{mention}") {
                const userMention = /<@(!)?\d*?>/u.exec(message.content);
                if (userMention?.index !== 0) return false;

                const user = this.getUserFromMention(userMention[0]);

                return user?.id === this.client.user?.id;
            }

            return message.content.startsWith(pr);
        });
        if ((pref?.length ?? 0) > 0) {
            this.client.commands.handle(message, pref as unknown as string);
        }
    }

    private getUserFromMention(mention: string): User | undefined {
        const matches = /^<@!?(\d+)>$/u.exec(mention);
        if (!matches) return undefined;

        const id = matches[1];
        return this.client.users.cache.get(id);
    }
}
