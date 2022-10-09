/* eslint-disable @typescript-eslint/no-unnecessary-condition, no-nested-ternary */
import { MessageInteractionAction } from "../typings";
import {
    ButtonInteraction,
    Collection,
    CommandInteraction,
    ContextMenuInteraction,
    GuildMember,
    Interaction,
    InteractionReplyOptions,
    Message,
    MessageActionRow,
    MessageButton,
    MessageComponentInteraction,
    MessageMentions,
    MessageOptions,
    MessagePayload,
    ModalSubmitFieldsResolver,
    ModalSubmitInteraction,
    SelectMenuInteraction,
    TextBasedChannel,
    User
} from "discord.js";

export class CommandContext {
    public additionalArgs = new Collection<string, any>();
    public channel: TextBasedChannel | null = this.context.channel;
    public guild = this.context.guild;

    public constructor(
        public readonly context:
            | CommandInteraction
            | ContextMenuInteraction
            | Interaction
            | Message
            | SelectMenuInteraction,
        public args: string[] = []
    ) {}

    public async deferReply(): Promise<void> {
        if (this.isInteraction()) {
            return (this.context as CommandInteraction).deferReply();
        }
        return Promise.resolve(undefined);
    }

    public async reply(
        options:
            | InteractionReplyOptions
            | MessageOptions
            | MessagePayload
            | string
            | { askDeletion?: { reference: string } },
        autoedit?: boolean
    ): Promise<Message> {
        if (this.isInteraction()) {
            if (
                ((this.context as Interaction).isCommand() || (this.context as Interaction).isSelectMenu()) &&
                (this.context as CommandInteraction).replied &&
                !autoedit
            )
                throw new Error("Interaction is already replied.");
        }

        const context = this.context as CommandInteraction | Message | SelectMenuInteraction;
        const rep = await this.send(
            options,
            this.isInteraction()
                ? (context as Interaction).isCommand() || (context as Interaction).isSelectMenu()
                    ? (context as CommandInteraction).replied || (context as CommandInteraction).deferred
                        ? "editReply"
                        : "reply"
                    : "reply"
                : "reply"
        ).catch(e => ({ error: e }));
        if (!rep || "error" in rep) {
            throw new Error(`Unable to reply context, because: ${rep ? (rep.error as Error).message : "Unknown"}`);
        }

        // @ts-expect-error-next-line
        return rep instanceof Message ? rep : new Message(this.context.client, rep);
    }

    public async send(
        options:
            | InteractionReplyOptions
            | MessageOptions
            | MessagePayload
            | string
            | { askDeletion?: { reference: string } },
        type: MessageInteractionAction = "editReply"
    ): Promise<Message> {
        const deletionBtn = new MessageActionRow().addComponents(new MessageButton().setEmoji("🗑️").setStyle("DANGER"));
        if ((options as { askDeletion?: { reference: string } }).askDeletion) {
            deletionBtn.components[0].setCustomId(
                Buffer.from(
                    `${(options as { askDeletion: { reference: string } }).askDeletion.reference}_delete-msg`
                ).toString("base64")
            );
            // eslint-disable-next-line @typescript-eslint/no-unused-expressions
            (options as InteractionReplyOptions).components
                ? (options as InteractionReplyOptions).components!.push(deletionBtn)
                : ((options as InteractionReplyOptions).components = [deletionBtn]);
        }
        if (this.isInteraction()) {
            (options as InteractionReplyOptions).fetchReply = true;
            const msg = (await (this.context as CommandInteraction)[type](
                options as InteractionReplyOptions | MessagePayload | string
            )) as Message;
            const channel = this.context.channel;
            const res = await channel!.messages.fetch(msg.id).catch(() => null);
            return res ?? msg;
        }
        if ((options as InteractionReplyOptions).ephemeral) {
            throw new Error("Cannot send ephemeral message in a non-interaction context.");
        }
        return this.context.channel!.send(options as MessageOptions | MessagePayload | string);
    }

    public isInteraction(): boolean {
        return this.context instanceof Interaction;
    }

    public isCommand(): boolean {
        return this.context instanceof CommandInteraction;
    }

    public isContextMenu(): boolean {
        return this.context instanceof ContextMenuInteraction;
    }

    public isMessageComponent(): boolean {
        return this.context instanceof MessageComponentInteraction;
    }

    public isButton(): boolean {
        return this.context instanceof ButtonInteraction;
    }

    public isSelectMenu(): boolean {
        return this.context instanceof SelectMenuInteraction;
    }

    public isModal(): boolean {
        return this.context instanceof ModalSubmitInteraction;
    }

    public get mentions(): MessageMentions | null {
        return this.context instanceof Message ? this.context.mentions : null;
    }

    public get deferred(): boolean {
        return this.context instanceof Interaction ? (this.context as CommandInteraction).deferred : false;
    }

    public get options(): CommandInteraction["options"] | null {
        return this.context instanceof Interaction ? (this.context as CommandInteraction).options : null;
    }

    public get fields(): ModalSubmitFieldsResolver | null {
        return this.context instanceof ModalSubmitInteraction ? (this.context as ModalSubmitInteraction).fields : null;
    }

    public get author(): User {
        return this.context instanceof Interaction ? this.context.user : this.context.author;
    }

    public get member(): GuildMember | null {
        return this.guild!.members.resolve(this.author.id);
    }
}
