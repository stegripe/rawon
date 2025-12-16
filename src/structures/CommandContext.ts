import { Buffer } from "node:buffer";
import type { BaseMessageOptions, ChatInputCommandInteraction, GuildMember, Interaction, InteractionReplyOptions, InteractionResponse, MessageMentions, MessagePayload, MessageReplyOptions, ModalSubmitFields, StringSelectMenuInteraction, TextBasedChannel, User } from "discord.js";
import { ActionRowBuilder, BaseInteraction, ButtonBuilder, ButtonInteraction, ButtonStyle, Collection, CommandInteraction, ContextMenuCommandInteraction, Message, MessageComponentInteraction, MessageFlags, ModalSubmitInteraction } from "discord.js";
import type { MessageInteractionAction } from "../typings/index.js";

export class CommandContext {
    public additionalArgs = new Collection<string, any>();
    public channel: TextBasedChannel | null;
    public guild;

    public constructor(
        public readonly context:
            | CommandInteraction
            | ContextMenuCommandInteraction
            | Interaction
            | Message
            | StringSelectMenuInteraction,
        public args: string[] = []
    ) {
        this.channel = this.context.channel;
        this.guild = this.context.guild;
    }

    public async deferReply(): Promise<InteractionResponse | undefined> {
        if (this.isInteraction()) {
            return (this.context as CommandInteraction).deferReply();
        }
        return undefined;
    }

    public async reply(
        options:
            | BaseMessageOptions
            | InteractionReplyOptions
            | MessagePayload
            | string
            | { askDeletion?: { reference: string } },
        autoedit?: boolean
    ): Promise<Message> {
        if (this.isInteraction() && 
                ((this.context as Interaction).isCommand() || (this.context as Interaction).isStringSelectMenu()) &&
                (this.context as CommandInteraction).replied &&
                autoedit !== true
            ) throw new Error("Interaction is already replied.");

        const context = this.context as CommandInteraction | Message | StringSelectMenuInteraction;
        const rep = await this.send(
            options,
            this.isInteraction()
                ? (context as Interaction).isCommand() || (context as Interaction).isStringSelectMenu()
                    ? (context as CommandInteraction).replied || (context as CommandInteraction).deferred
                        ? "editReply"
                        : "reply"
                    : "reply"
                : "reply"
        ).catch((error: unknown) => ({ error }));
        if ("error" in rep) {
            throw new Error(`Unable to reply context, because: ${(rep.error as Error).message}`);
        }

        // @ts-expect-error-next-line
        // eslint-disable-next-line typescript/no-unsafe-return
        return rep instanceof Message ? rep : new Message(this.context.client, rep);
    }

    public async send(
        options:
            | BaseMessageOptions
            | InteractionReplyOptions
            | MessagePayload
            | string
            | { askDeletion?: { reference: string } },
        type: MessageInteractionAction = "editReply"
    ): Promise<Message> {
        const deletionBtn = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder().setEmoji("🗑️").setStyle(ButtonStyle.Danger)
        );
        if ((options as { askDeletion?: { reference: string } }).askDeletion) {
            deletionBtn.components[0].setCustomId(
                Buffer.from(
                    `${(options as { askDeletion: { reference: string } }).askDeletion.reference}_delete-msg`
                ).toString("base64")
            );
            (options as InteractionReplyOptions).components = [
                ...(options as InteractionReplyOptions).components ?? [],
                deletionBtn
            ];
        }
        if (this.isInteraction()) {
            (options as InteractionReplyOptions).withResponse = true;
            // eslint-disable-next-line typescript/no-unsafe-argument
            const msg = (await (this.context as CommandInteraction)[type](options as any)) as Message;
            const channel = this.context.channel;
            const res = await channel?.messages.fetch(msg.id).catch(() => null);
            return res ?? msg;
        }
        const flags = (options as InteractionReplyOptions).flags;
        if (flags !== undefined && ((flags as number) & MessageFlags.Ephemeral) !== 0) {
            throw new Error("Cannot send ephemeral message in a non-interaction context.");
        }
        if (typeof options === "string") {
            // eslint-disable-next-line no-param-reassign
            options = { content: options };
        }

        ((options as MessageReplyOptions).allowedMentions ??= {}).repliedUser = false;
        return (this.context as Message).reply(options as MessageReplyOptions);
    }

    public isInteraction(): boolean {
        return this.context instanceof BaseInteraction;
    }

    public isCommand(): boolean {
        return this.context instanceof CommandInteraction;
    }

    public isContextMenu(): boolean {
        return this.context instanceof ContextMenuCommandInteraction;
    }

    public isMessageComponent(): boolean {
        return this.context instanceof MessageComponentInteraction;
    }

    public isButton(): boolean {
        return this.context instanceof ButtonInteraction;
    }

    public isStringSelectMenu(): boolean {
        return this.context instanceof MessageComponentInteraction;
    }

    public isModal(): boolean {
        return this.context instanceof ModalSubmitInteraction;
    }

    public get mentions(): MessageMentions | null {
        return this.context instanceof Message ? this.context.mentions : null;
    }

    public get deferred(): boolean {
        return this.context instanceof BaseInteraction ? (this.context as CommandInteraction).deferred : false;
    }

    public get options(): ChatInputCommandInteraction["options"] | null {
        /* Not sure about this but CommandInteraction does not provides getString method anymore */
        return this.context instanceof BaseInteraction ? (this.context as ChatInputCommandInteraction).options : null;
    }

    public get fields(): ModalSubmitFields | null {
        return this.context instanceof ModalSubmitInteraction ? this.context.fields : null;
    }

    public get author(): User {
        return this.context instanceof BaseInteraction ? this.context.user : this.context.author;
    }

    public get member(): GuildMember | null {
        return this.guild?.members.resolve(this.author.id) ?? null;
    }
}
