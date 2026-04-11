import { Buffer } from "node:buffer";
import {
    ActionRowBuilder,
    type APIMessageTopLevelComponent,
    BaseInteraction,
    type BaseMessageOptions,
    ButtonBuilder,
    ButtonInteraction,
    ButtonStyle,
    type ChatInputCommandInteraction,
    Collection,
    CommandInteraction,
    ContextMenuCommandInteraction,
    type GuildMember,
    type Interaction,
    type InteractionReplyOptions,
    type InteractionResponse,
    Message,
    MessageComponentInteraction,
    MessageFlags,
    type MessageMentions,
    type MessagePayload,
    type MessageReplyOptions,
    type ModalSubmitFields,
    ModalSubmitInteraction,
    PermissionFlagsBits,
    type StringSelectMenuInteraction,
    type TextBasedChannel,
    type User,
} from "discord.js";
import { type Rawon } from "../structures/Rawon.js";
import { type MessageInteractionAction } from "../typings/index.js";
import { createEmbed } from "../utils/functions/createEmbed.js";
import { i18n__mf } from "../utils/functions/i18n.js";

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
        public args: string[] = [],
    ) {
        this.channel = this.context.channel;
        this.guild = this.context.guild;
    }

    private isPermissionLikeError(error: unknown): boolean {
        const code = (error as { code?: number })?.code;
        if (code === 50_013 || code === 50_001) {
            return true;
        }

        const message = (error as Error)?.message?.toLowerCase() ?? "";
        return message.includes("missing permissions") || message.includes("missing access");
    }

    private formatPermissionName(permission: bigint): string {
        const flagName = Object.entries(PermissionFlagsBits).find(
            ([, value]) => value === permission,
        )?.[0];
        const spacedName = (flagName ?? "Unknown").replace(/([a-z])([A-Z])/g, "$1 $2");
        return `**\`${spacedName}\`**`;
    }

    private getMissingReplyPermissions(): bigint[] {
        const requiredPermissions = [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.EmbedLinks,
            PermissionFlagsBits.ReadMessageHistory,
        ];

        if (!this.guild || !this.channel || !("permissionsFor" in this.channel)) {
            return [...requiredPermissions];
        }

        const botMember =
            this.guild.members.me ?? this.guild.members.cache.get(this.client.user?.id ?? "");
        if (!botMember) {
            return [...requiredPermissions];
        }

        const permissions = this.channel.permissionsFor(botMember);
        if (!permissions) {
            return [...requiredPermissions];
        }

        return requiredPermissions.filter((permission) => !permissions.has(permission));
    }

    private async notifyPermissionIssueFallback(): Promise<void> {
        if (!this.guild) {
            return;
        }

        const __mf = i18n__mf(this.client as Rawon, this.guild);
        const channelMention = this.channel ? `<#${this.channel.id}>` : this.guild.name;

        const missingPermissions = this.getMissingReplyPermissions();
        const permissionNames = missingPermissions
            .map((permission) => this.formatPermissionName(permission))
            .join(", ");

        const fallbackPermissions = [
            this.formatPermissionName(PermissionFlagsBits.ViewChannel),
            this.formatPermissionName(PermissionFlagsBits.SendMessages),
            this.formatPermissionName(PermissionFlagsBits.EmbedLinks),
        ].join(", ");

        const messageText = __mf("utils.commonUtil.botMissingChannelPerms", {
            channel: channelMention,
            permissions: permissionNames.length > 0 ? permissionNames : fallbackPermissions,
        });

        await this.author
            .send({
                embeds: [createEmbed("error", messageText, true)],
            })
            .catch(() => null);
    }

    private async handleSendError(error: unknown): Promise<void> {
        if (!this.isPermissionLikeError(error)) {
            return;
        }

        await this.notifyPermissionIssueFallback();
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
        autoedit?: boolean,
    ): Promise<Message> {
        if (
            this.isInteraction() &&
            ((this.context as Interaction).isCommand() ||
                (this.context as Interaction).isStringSelectMenu()) &&
            (this.context as CommandInteraction).replied &&
            autoedit !== true
        ) {
            throw new Error("Interaction is already replied.");
        }

        const context = this.context as CommandInteraction | Message | StringSelectMenuInteraction;
        const rep = await this.send(
            options,
            this.isInteraction()
                ? (context as Interaction).isCommand() ||
                  (context as Interaction).isStringSelectMenu()
                    ? (context as CommandInteraction).replied ||
                      (context as CommandInteraction).deferred
                        ? "editReply"
                        : "reply"
                    : "reply"
                : "reply",
        ).catch((error: unknown) => ({ error }));
        if ("error" in rep) {
            await this.handleSendError(rep.error);
            throw new Error(`Unable to reply context, because: ${(rep.error as Error).message}`);
        }

        // @ts-expect-error-next-line
        return rep instanceof Message ? rep : new Message(this.context.client, rep);
    }

    public async send(
        options:
            | BaseMessageOptions
            | InteractionReplyOptions
            | MessagePayload
            | string
            | { askDeletion?: { reference: string } },
        type: MessageInteractionAction = "editReply",
    ): Promise<Message> {
        try {
            const deletionBtn = new ActionRowBuilder<ButtonBuilder>().addComponents(
                new ButtonBuilder().setEmoji("🗑️").setStyle(ButtonStyle.Danger),
            );
            if ((options as { askDeletion?: { reference: string } }).askDeletion) {
                deletionBtn.components[0].setCustomId(
                    Buffer.from(
                        `${(options as { askDeletion: { reference: string } }).askDeletion.reference}_delete-msg`,
                    ).toString("base64"),
                );
                (options as InteractionReplyOptions).components = [
                    ...((options as InteractionReplyOptions).components ?? []),
                    deletionBtn.toJSON() as APIMessageTopLevelComponent,
                ];
            }
            if (this.isInteraction()) {
                (options as InteractionReplyOptions).withResponse = true;
                const msg = (await (this.context as CommandInteraction)[type](options as any)) as
                    | Message
                    | null
                    | undefined;
                const channel = this.context.channel;
                if (!msg?.id) {
                    const res = await channel?.messages
                        .fetch({ limit: 1 })
                        .then((c) => c.first())
                        .catch(() => null);
                    return (res as Message) ?? (msg as Message);
                }
                const res = await channel?.messages.fetch(msg.id).catch(() => null);
                return res ?? msg;
            }
            const flags = (options as InteractionReplyOptions).flags;
            if (flags !== undefined && ((flags as number) & MessageFlags.Ephemeral) !== 0) {
                throw new Error("Cannot send ephemeral message in a non-interaction context.");
            }
            if (typeof options === "string") {
                options = { content: options };
            }

            ((options as MessageReplyOptions).allowedMentions ??= {}).repliedUser = false;
            return (this.context as Message).reply(options as MessageReplyOptions);
        } catch (error) {
            await this.handleSendError(error);
            throw error;
        }
    }

    public isInteraction(): boolean {
        return this.context instanceof BaseInteraction;
    }

    public isCommandInteraction(): boolean {
        return (
            this.context instanceof CommandInteraction ||
            this.context instanceof ContextMenuCommandInteraction
        );
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

    public isStringSelectMenu(): this is this & {
        context: StringSelectMenuInteraction;
    } {
        return (
            this.context instanceof MessageComponentInteraction && this.context.isStringSelectMenu()
        );
    }

    public isModal(): boolean {
        return this.context instanceof ModalSubmitInteraction;
    }

    public get mentions(): MessageMentions | null {
        return this.context instanceof Message ? this.context.mentions : null;
    }

    public get deferred(): boolean {
        return this.context instanceof BaseInteraction
            ? (this.context as CommandInteraction).deferred
            : false;
    }

    public get options(): ChatInputCommandInteraction["options"] | null {
        return this.context instanceof BaseInteraction
            ? (this.context as ChatInputCommandInteraction).options
            : null;
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

    public get client() {
        return this.context.client;
    }
}
