import { CommandInteraction, ContextMenuInteraction, Interaction, InteractionButtonOptions, Message, MessageActionRow, MessageButton, SelectMenuInteraction, TextChannel } from "discord.js";
import { PaginationPayload } from "../typings";

const DATAS: InteractionButtonOptions[] = [
    {
        style: "SECONDARY",
        emoji: "⏪",
        customId: "PREV10"
    },
    {
        style: "PRIMARY",
        emoji: "⬅️",
        customId: "PREV"
    },
    {
        style: "DANGER",
        emoji: "🚫",
        customId: "STOP"
    },
    {
        style: "PRIMARY",
        emoji: "➡️",
        customId: "NEXT"
    },
    {
        style: "SECONDARY",
        emoji: "⏩",
        customId: "NEXT10"
    }
];

export class ButtonPagination {
    public constructor(public readonly msg: Interaction|CommandInteraction|SelectMenuInteraction|ContextMenuInteraction|Message, public readonly payload: PaginationPayload) {}

    public async start(): Promise<void> {
        const embed = this.payload.embed;
        const pages = this.payload.pages;
        let index = 0;

        this.payload.edit.call(this, index, embed, pages[index]);
        const isInteraction = this.msg instanceof CommandInteraction;
        const buttons = DATAS.map(d => new MessageButton(d));
        const toSend = {
            content: this.payload.content,
            embeds: [embed],
            components: pages.length < 2
                ? []
                : [
                    new MessageActionRow()
                        .addComponents(buttons)
                ]
        };
        const msg = await (isInteraction ? (this.msg as CommandInteraction).editReply(toSend) : await (this.msg as Message).edit(toSend));
        const fetchedMsg = await (this.msg.client.channels.cache.get(this.msg.channelId!) as TextChannel).messages.fetch(msg.id);
        if (pages.length < 2) return;
        const collector = fetchedMsg.createMessageComponentCollector({
            filter: i => {
                void i.deferUpdate();
                return DATAS.map(x => x.customId.toLowerCase()).includes(i.customId.toLowerCase()) && i.user.id === this.payload.author;
            }
        });

        collector.on("collect", async i => {
            if (i.customId === "PREV10") {
                index -= 10;
            } else if (i.customId === "PREV") {
                index--;
            } else if (i.customId === "NEXT") {
                index++;
            } else if (i.customId === "NEXT10") {
                index += 10;
            } else {
                await (msg as Message).delete();
                return;
            }

            index = ((index % pages.length) + Number(pages.length)) % pages.length;

            this.payload.edit.call(this, index, embed, pages[index]);
            await fetchedMsg.edit({
                embeds: [embed],
                content: this.payload.content,
                components: pages.length < 2
                    ? []
                    : [
                        new MessageActionRow()
                            .addComponents(buttons)
                    ]
            });
        });
    }
}
