import { container as sapphireContainer } from "@sapphire/framework";
import {
    type APIEmbed,
    type APIMessageTopLevelComponent,
    CommandInteraction,
    ContainerBuilder,
    DMChannel,
    GuildMember,
    MediaGalleryBuilder,
    MediaGalleryItemBuilder,
    Message,
    MessageComponentInteraction,
    type MessageCreateOptions,
    type MessageEditOptions,
    MessageFlags,
    MessageFlagsBitField,
    ModalSubmitInteraction,
    NewsChannel,
    SectionBuilder,
    SeparatorBuilder,
    StageChannel,
    TextChannel,
    TextDisplayBuilder,
    ThreadChannel,
    ThumbnailBuilder,
    User,
    VoiceChannel,
} from "discord.js";

type ComponentsV2Mode = "create" | "edit";
type MessageOptions = Record<string, unknown> & {
    components?: unknown[];
    content?: unknown;
    embeds?: unknown[];
    flags?: unknown;
};

const MAX_TEXT_DISPLAY_LENGTH = 4_000;
const PATCHED = Symbol.for("rawon.componentsV2MessagesPatched");

function truncateText(value: string, maxLength = MAX_TEXT_DISPLAY_LENGTH): string {
    if (value.length <= maxLength) {
        return value;
    }

    return `${value.slice(0, maxLength - 1)}…`;
}

function chunkText(value: string): string[] {
    if (value.length <= MAX_TEXT_DISPLAY_LENGTH) {
        return [value];
    }

    const chunks: string[] = [];
    for (let index = 0; index < value.length; index += MAX_TEXT_DISPLAY_LENGTH) {
        chunks.push(value.slice(index, index + MAX_TEXT_DISPLAY_LENGTH));
    }

    return chunks;
}

function isHttpUrl(url: string | undefined): url is string {
    return typeof url === "string" && /^https?:\/\//iu.test(url);
}

function getFallbackAccentColor(): number {
    const embedColor = sapphireContainer.data?.botSettings?.embedColor;
    const parsed = Number.parseInt(`${embedColor ?? ""}`.replace(/^#/u, ""), 16);

    if (!Number.isFinite(parsed) || parsed < 0 || parsed > 0xffffff) {
        return 0x22c9ff;
    }

    return parsed;
}

function resolveFlags(flags: unknown): number {
    try {
        return MessageFlagsBitField.resolve(flags as never);
    } catch {
        return 0;
    }
}

function toAPIEmbed(embed: unknown): APIEmbed | null {
    if (typeof embed !== "object" || embed === null) {
        return null;
    }

    if ("toJSON" in embed && typeof embed.toJSON === "function") {
        return embed.toJSON() as APIEmbed;
    }

    return embed as APIEmbed;
}

function addTextComponents(container: ContainerBuilder, text: string): void {
    for (const chunk of chunkText(text).filter((part) => part.trim().length > 0)) {
        container.addTextDisplayComponents(new TextDisplayBuilder().setContent(chunk));
    }
}

function addEmbedTextComponents(
    container: ContainerBuilder,
    textBlocks: string[],
    thumbnailUrl: string | undefined,
): void {
    const blocks = textBlocks.filter((part) => part.trim().length > 0);
    if (blocks.length === 0) {
        return;
    }

    if (!thumbnailUrl) {
        for (const block of blocks) {
            addTextComponents(container, block);
        }
        return;
    }

    const [firstBlock, ...remainingBlocks] = blocks;
    const firstBlockChunks = chunkText(firstBlock);
    const sectionTextComponents = firstBlockChunks
        .slice(0, 3)
        .map((chunk) => new TextDisplayBuilder().setContent(chunk));

    container.addSectionComponents(
        new SectionBuilder()
            .addTextDisplayComponents(...sectionTextComponents)
            .setThumbnailAccessory(new ThumbnailBuilder().setURL(thumbnailUrl)),
    );

    for (const block of [...firstBlockChunks.slice(3), ...remainingBlocks]) {
        addTextComponents(container, block);
    }
}

function createEmbedContainer(embedLike: unknown): APIMessageTopLevelComponent | null {
    const embed = toAPIEmbed(embedLike);
    if (!embed) {
        return null;
    }

    const container = new ContainerBuilder().setAccentColor(
        embed.color ?? getFallbackAccentColor(),
    );
    const headerParts: string[] = [];
    const textBlocks: string[] = [];
    const thumbnailUrl = isHttpUrl(embed.thumbnail?.url) ? embed.thumbnail.url : undefined;

    if (embed.author?.name) {
        headerParts.push(`### ${embed.author.name}`);
    }

    if (embed.title) {
        const title = embed.url ? `[${embed.title}](${embed.url})` : embed.title;
        headerParts.push(`## ${title}`);
    }

    if (headerParts.length > 0) {
        textBlocks.push(headerParts.join("\n"));
    }

    if (embed.description) {
        textBlocks.push(embed.description);
    }

    if (Array.isArray(embed.fields) && embed.fields.length > 0) {
        const fieldsText = embed.fields
            .map((field) => `**${field.name}**\n${field.value}`)
            .join("\n\n");
        textBlocks.push(fieldsText);
    }

    const footerParts = [embed.footer?.text, embed.timestamp].filter(
        (part): part is string => typeof part === "string" && part.length > 0,
    );
    if (footerParts.length > 0) {
        textBlocks.push(truncateText(footerParts.join(" • ")));
    }

    addEmbedTextComponents(container, textBlocks, thumbnailUrl);

    const imageUrl = isHttpUrl(embed.image?.url) ? embed.image.url : undefined;
    if (imageUrl) {
        if (textBlocks.length > 0) {
            container.addSeparatorComponents(new SeparatorBuilder());
        }

        container.addMediaGalleryComponents(
            new MediaGalleryBuilder().addItems(new MediaGalleryItemBuilder().setURL(imageUrl)),
        );
    }

    return container.toJSON() as APIMessageTopLevelComponent;
}

export function normalizeComponentsV2MessageOptions<T>(options: T, mode: ComponentsV2Mode): T {
    if (typeof options !== "object" || options === null) {
        return options;
    }

    const messageOptions = options as MessageOptions;
    if (!Array.isArray(messageOptions.embeds) || messageOptions.embeds.length === 0) {
        return options;
    }

    const convertedComponents: APIMessageTopLevelComponent[] = [];
    if (typeof messageOptions.content === "string" && messageOptions.content.trim().length > 0) {
        convertedComponents.push(
            new TextDisplayBuilder()
                .setContent(truncateText(messageOptions.content))
                .toJSON() as APIMessageTopLevelComponent,
        );
    }

    for (const embed of messageOptions.embeds) {
        const component = createEmbedContainer(embed);
        if (component) {
            convertedComponents.push(component);
        }
    }

    convertedComponents.push(
        ...((messageOptions.components ?? []) as APIMessageTopLevelComponent[]),
    );

    const normalized: MessageOptions = {
        ...messageOptions,
        components: convertedComponents,
        embeds: mode === "edit" ? [] : undefined,
        flags: resolveFlags(messageOptions.flags) | MessageFlags.IsComponentsV2,
    };

    if (mode === "edit") {
        normalized.content = null;
    } else {
        delete normalized.content;
    }

    return normalized as T;
}

function patchMethod<T extends object>(
    prototype: T | undefined,
    methodName: string,
    mode: ComponentsV2Mode,
): void {
    if (!prototype || !(methodName in prototype)) {
        return;
    }

    const target = prototype as Record<PropertyKey, unknown>;
    const original = target[methodName];
    if (typeof original !== "function" || (original as { [PATCHED]?: boolean })[PATCHED]) {
        return;
    }

    const patched = function patchedComponentsV2MessageMethod(
        this: unknown,
        options: unknown,
        ...args: unknown[]
    ) {
        return original.call(this, normalizeComponentsV2MessageOptions(options, mode), ...args);
    };
    (patched as { [PATCHED]?: boolean })[PATCHED] = true;
    target[methodName] = patched;
}

export function patchComponentsV2Messages(): void {
    for (const prototype of [
        TextChannel.prototype,
        VoiceChannel.prototype,
        StageChannel.prototype,
        NewsChannel.prototype,
        ThreadChannel.prototype,
        DMChannel.prototype,
        User.prototype,
        GuildMember.prototype,
    ]) {
        patchMethod(prototype, "send", "create");
    }

    patchMethod(Message.prototype, "reply", "create");
    patchMethod(Message.prototype, "edit", "edit");

    for (const prototype of [
        CommandInteraction.prototype,
        MessageComponentInteraction.prototype,
        ModalSubmitInteraction.prototype,
    ]) {
        patchMethod(prototype, "reply", "create");
        patchMethod(prototype, "followUp", "create");
        patchMethod(prototype, "editReply", "edit");
        patchMethod(prototype, "update", "edit");
    }
}

export function createComponentsV2MessageOptions(
    options: MessageCreateOptions,
): MessageCreateOptions {
    return normalizeComponentsV2MessageOptions(options, "create");
}

export function editComponentsV2MessageOptions(options: MessageEditOptions): MessageEditOptions {
    return normalizeComponentsV2MessageOptions(options, "edit");
}
