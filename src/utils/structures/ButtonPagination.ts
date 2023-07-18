import { PaginationPayload } from "../../typings/index.js";
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, CommandInteraction, ComponentType, ContextMenuCommandInteraction, Interaction, InteractionButtonComponentData, Message, StringSelectMenuInteraction, TextChannel } from "discord.js";

const DATAS: InteractionButtonComponentData[] = [
    {
        style: ButtonStyle.Secondary,
        emoji: "⏪",
        customId: `PREV10`,
        type: ComponentType.Button
    },
    {
        style: ButtonStyle.Primary,
        emoji: "⬅️",
        customId: "PREV",
        type: ComponentType.Button
    },
    {
        style: ButtonStyle.Danger,
        emoji: "🚫",
        customId: "STOP",
        type: ComponentType.Button
    },
    {
        style: ButtonStyle.Primary,
        emoji: "➡️",
        customId: "NEXT",
        type: ComponentType.Button
    },
    {
        style: ButtonStyle.Secondary,
        emoji: "⏩",
        customId: "NEXT10",
        type: ComponentType.Button
    }
];

export class ButtonPagination {
    public constructor(
        public readonly msg:
            | CommandInteraction
            | ContextMenuCommandInteraction
            | Interaction
            | Message
            | StringSelectMenuInteraction,
        public readonly payload: PaginationPayload
    ) { }

    public async start(): Promise<void> {
        const embed = this.payload.embed;
        const pages = this.payload.pages;
        let index = 0;

        this.payload.edit.call(this, index, embed, pages[index]);

        const isInteraction = this.msg instanceof CommandInteraction;
        const buttons = DATAS.map(d => new ButtonBuilder(d));
        const toSend = {
            content: this.payload.content,
            embeds: [embed],
            components: pages.length < 2 ? [] : [new ActionRowBuilder<ButtonBuilder>().addComponents(buttons)]
        };
        const msg = await (isInteraction
            ? (this.msg as CommandInteraction).editReply(toSend)
            : await (this.msg as Message).edit(toSend));
        const fetchedMsg = await (
            this.msg.client.channels.cache.get(this.msg.channelId!) as TextChannel
        ).messages.fetch(msg.id);

        if (pages.length < 2) return;

        const collector = fetchedMsg.createMessageComponentCollector({
            filter: i => {
                void i.deferUpdate();
                return (
                    DATAS.map(x => x.customId.toLowerCase()).includes(i.customId.toLowerCase()) &&
                    i.user.id === this.payload.author
                );
            },
            componentType: ComponentType.Button
        });

        collector.on("collect", async i => {
            switch (i.customId) {
                case "PREV10":
                    index -= 10;
                    break;
                case "PREV":
                    index--;
                    break;
                case "NEXT":
                    index++;
                    break;
                case "NEXT10":
                    index += 10;
                    break;
                default:
                    void msg.delete();
                    return;
            }

            index = ((index % pages.length) + Number(pages.length)) % pages.length;

            this.payload.edit.call(this, index, embed, pages[index]);
            await fetchedMsg.edit({
                embeds: [embed],
                content: this.payload.content,
                components: pages.length < 2 ? [] : [new ActionRowBuilder<ButtonBuilder>().addComponents(buttons)]
            });
        });
    }
}
