import { Buffer } from "node:buffer";
import { setTimeout } from "node:timers";
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
    public readonly originChannel: TextBasedChannel | null;
    public readonly originGuild;

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
        this.originChannel = this.context.channel;
        this.originGuild = this.context.guild;
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

        if (!this.originGuild || !this.originChannel || !("permissionsFor" in this.originChannel)) {
            return [...requiredPermissions];
        }

        const botMember =
            this.originGuild.members.me ??
            this.originGuild.members.cache.get(this.context.client.user?.id ?? "");
        if (!botMember) {
            return [...requiredPermissions];
        }

        const permissions = this.originChannel.permissionsFor(botMember);
        if (!permissions) {
            return [...requiredPermissions];
        }

        return requiredPermissions.filter((permission) => !permissions.has(permission));
    }

    private async notifyPermissionIssueFallback(): Promise<void> {
        if (!this.originGuild) {
            return;
        }

        const __mf = i18n__mf(this.context.client as Rawon, this.originGuild);
        const channelMention = this.originChannel
            ? `<#${this.originChannel.id}>`
            : this.originGuild.name;

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

    private shouldUseEphemeralReplies(): boolean {
        return this.additionalArgs.get("ephemeralRequestChannel") === true;
    }

    private applyEphemeralFlag(options: InteractionReplyOptions): void {
        const flags = options.flags;
        options.flags = ((typeof flags === "number" ? flags : 0) |
            MessageFlags.Ephemeral) as InteractionReplyOptions["flags"];
    }

    private scheduleRequestChannelReplyCleanup(message: Message | null | undefined): void {
        if (
            !this.shouldUseEphemeralReplies() ||
            !message ||
            message.flags.has(MessageFlags.Ephemeral)
        ) {
            return;
        }

        setTimeout(() => {
            void message.delete().catch(() => null);
        }, 60_000);
    }

    public async deferReply(
        options?: Parameters<CommandInteraction["deferReply"]>[0],
    ): Promise<InteractionResponse | undefined> {
        if (this.isInteraction()) {
            const deferOptions = { ...(options ?? {}) } as NonNullable<
                Parameters<CommandInteraction["deferReply"]>[0]
            >;
            if (this.shouldUseEphemeralReplies()) {
                const flags = deferOptions.flags;
                deferOptions.flags = ((typeof flags === "number" ? flags : 0) |
                    MessageFlags.Ephemeral) as typeof deferOptions.flags;
            }

            return (this.context as CommandInteraction).deferReply(deferOptions);
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
            if (typeof options === "string") {
                options = { content: options };
            }

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
                if (this.shouldUseEphemeralReplies() && type !== "editReply") {
                    this.applyEphemeralFlag(options as InteractionReplyOptions);
                }

                if (type === "reply") {
                    (options as InteractionReplyOptions).withResponse = true;
                }

                const interaction = this.context as CommandInteraction;
                const msg = (await interaction[type](options as any)) as
                    | { resource?: { message?: Message | null } }
                    | Message
                    | null
                    | undefined;
                if (msg instanceof Message) {
                    this.scheduleRequestChannelReplyCleanup(msg);
                    return msg;
                }

                const fetchedReply =
                    type === "followUp" ? null : await interaction.fetchReply().catch(() => null);
                if (fetchedReply) {
                    const message = fetchedReply as Message;
                    this.scheduleRequestChannelReplyCleanup(message);
                    return message;
                }

                const resourceMessage = msg?.resource?.message;
                if (resourceMessage) {
                    this.scheduleRequestChannelReplyCleanup(resourceMessage);
                    return resourceMessage;
                }

                const channel = this.context.channel;
                const res = await channel?.messages
                    .fetch({ limit: 1 })
                    .then((c) => c.first())
                    .catch(() => null);
                this.scheduleRequestChannelReplyCleanup(res as Message | null);
                return res as Message;
            }
            const flags = (options as InteractionReplyOptions).flags;
            if (flags !== undefined && ((flags as number) & MessageFlags.Ephemeral) !== 0) {
                throw new Error("Cannot send ephemeral message in a non-interaction context.");
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
        const musicTarget = this.additionalArgs.get("musicCommandTarget") as
            | { client?: Rawon }
            | undefined;
        return musicTarget?.client ?? this.context.client;
    }
}
