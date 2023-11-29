import { ButtonInteraction, Collection, CommandInteraction, CommandInteractionOptionResolver, ContextMenuCommandInteraction, Guild, GuildMember, Interaction, InteractionReplyOptions, Message, BaseMessageOptions, MessagePayload, SelectMenuInteraction, TextBasedChannel, User, BaseInteraction, StringSelectMenuInteraction, InteractionResponse } from "discord.js";

export class CommandContext {
    public additionalArgs = new Collection<string, any>();

    public constructor(public readonly context: Interaction | Message, public args: string[] = []) {}

    public get author(): User {
        return this.isInteraction() ? this.context.user : (this.context as Message).author;
    }

    public get deferred(): boolean {
        return this.isCommand() && this.context.deferred;
    }

    public get replied(): boolean {
        return this.isCommand() && this.context.replied;
    }

    public get channel(): TextBasedChannel | null {
        return this.context.channel;
    }

    public get guild(): Guild | null {
        return this.context.guild;
    }

    public get member(): GuildMember | null {
        return this.guild!.members.resolve(this.author.id);
    }

    public get options(): CommandInteractionOptionResolver<"cached"> | null {
        return this.isCommand() ? this.context.options as CommandInteractionOptionResolver : null;
    }

    public async deferReply(): Promise<InteractionResponse | undefined> {
        return this.isInteraction() ? (this.context as CommandInteraction).deferReply() : undefined;
    }

    public async reply(options: Parameters<this["send"]>[0], autoedit = true): Promise<Message> {
        const isReplied = this.isCommand() && (this.replied || this.deferred);
        if (isReplied && !autoedit) {
            throw new Error("Interaction is already replied.");
        }

        const reply = await this.send(options, isReplied ? "editReply" : "reply").catch((e: Error) => e);
        if (reply instanceof Error) throw new Error(`Unable to reply context, because: ${reply.message}`);

        return reply;
    }

    public async send(options: BaseMessageOptions | InteractionReplyOptions | MessagePayload | string, type: "editReply" | "followUp" | "reply"): Promise<Message> {
        if (this.isInteraction()) {
            if (typeof options === "object") (options as InteractionReplyOptions).fetchReply = true;
            const msg = await (this.context as CommandInteraction)[type](options as InteractionReplyOptions | MessagePayload | string) as Message;
            const channel = this.context.channel;
            const res = await channel!.messages.fetch(msg.id).catch(() => null);
            return res ?? msg;
        }
        if ((options as InteractionReplyOptions).ephemeral) {
            throw new Error("Cannot send ephemeral message in a non-interaction context.");
        }
        return (this.context as Message).reply(options as BaseMessageOptions | MessagePayload | string);
    }

    public async delete(): Promise<void> {
        if (this.isCommand()) {
            await this.context.deleteReply();
        } else if (this.isMessage()) {
            await this.context.delete();
        }
    }

    public isMessage(): this is MessageCommandContext {
        return this.context instanceof Message;
    }

    public isInteraction(): this is InteractionCommandContext {
        return this.context instanceof BaseInteraction;
    }

    public isCommand(): this is CommandInteractionCommandContext {
        return this.context instanceof CommandInteraction || this.context instanceof ContextMenuCommandInteraction;
    }

    public isButton(): this is ButtonInteractionCommandContext {
        return this.context instanceof ButtonInteraction;
    }

    public isSelectMenu(): this is SelectMenuInteractionCommandContext {
        return this.context instanceof StringSelectMenuInteraction;
    }
}

type MessageCommandContext = CommandContext & { context: Message };
type InteractionCommandContext = CommandContext & { context: Interaction };
type CommandInteractionCommandContext = CommandContext & { context: CommandInteraction; options: CommandInteraction["options"] };
type ButtonInteractionCommandContext = CommandContext & { context: ButtonInteraction; options: null };
type SelectMenuInteractionCommandContext = CommandContext & { context: SelectMenuInteraction; options: null };
