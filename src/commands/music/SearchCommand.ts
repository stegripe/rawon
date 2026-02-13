/** biome-ignore-all lint/style/useNamingConvention: disable naming convention rule for this file */
import { Buffer } from "node:buffer";
import { setTimeout } from "node:timers";
import { ApplyOptions } from "@sapphire/decorators";
import { type Command } from "@sapphire/framework";
import { type CommandContext, ContextCommand } from "@stegripe/command-context";
import {
    ActionRowBuilder,
    type Collection,
    type CommandInteractionOptionResolver,
    ComponentType,
    escapeMarkdown,
    type Message,
    PermissionFlagsBits,
    type SelectMenuComponentOptionData,
    type SlashCommandBuilder,
    StringSelectMenuBuilder,
    type StringSelectMenuInteraction,
} from "discord.js";
import i18n from "../../config/index.js";
import { CommandContext as LocalCommandContext } from "../../structures/CommandContext.js";
import { type Rawon } from "../../structures/Rawon.js";
import { type Song } from "../../typings/index.js";
import { inVC, sameVC, useRequestChannel, validVC } from "../../utils/decorators/MusicUtil.js";
import { createEmbed } from "../../utils/functions/createEmbed.js";
import { i18n__, i18n__mf } from "../../utils/functions/i18n.js";
import { parseHTMLElements } from "../../utils/functions/parseHTMLElements.js";
import { checkQuery, searchTrack } from "../../utils/handlers/GeneralUtil.js";

@ApplyOptions<Command.Options>({
    name: "search",
    aliases: ["sc"],
    description: i18n.__("commands.music.search.description"),
    detailedDescription: { usage: i18n.__("commands.music.search.usage") },
    requiredClientPermissions: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.EmbedLinks,
    ],
    chatInputCommand(
        builder: Parameters<NonNullable<Command.Options["chatInputCommand"]>>[0],
        opts: Parameters<NonNullable<Command.Options["chatInputCommand"]>>[1],
    ): SlashCommandBuilder {
        return builder
            .setName(opts.name ?? "search")
            .setDescription(opts.description ?? i18n.__("commands.music.search.description"))
            .addStringOption((opt) =>
                opt
                    .setName("query")
                    .setDescription(i18n.__("commands.music.search.slashQueryDescription"))
                    .setRequired(false),
            )
            .addStringOption((opt) =>
                opt
                    .setName("source")
                    .setDescription(i18n.__("commands.music.search.slashSourceDescription"))
                    .setRequired(false)
                    .addChoices(
                        { name: "YouTube", value: "youtube" },
                        { name: "SoundCloud", value: "soundcloud" },
                    ),
            ) as SlashCommandBuilder;
    },
})
export class SearchCommand extends ContextCommand {
    private getClient(ctx: CommandContext): Rawon {
        return ctx.client as Rawon;
    }

    private isRequestChannel(client: Rawon, ctx: CommandContext): boolean {
        if (!ctx.guild) {
            return false;
        }
        const requestChannel = client.requestChannelManager.getRequestChannel(ctx.guild);
        return requestChannel !== null && ctx.channel?.id === requestChannel.id;
    }

    private autoDeleteMessage(msg: Message, delay = 60_000): void {
        setTimeout(() => {
            msg.delete().catch(() => null);
        }, delay);
    }

    @useRequestChannel
    @inVC
    @validVC
    @sameVC
    public async contextRun(ctx: CommandContext): Promise<Message | undefined> {
        const localCtx = ctx as unknown as LocalCommandContext;
        const client = this.getClient(ctx);
        const __ = i18n__(client, ctx.guild);
        const __mf = i18n__mf(client, ctx.guild);

        if (ctx.isCommandInteraction() && !localCtx.deferred) {
            await localCtx.deferReply();
        }

        const values = localCtx.additionalArgs.get("values") as string[] | undefined;
        if (values && localCtx.isStringSelectMenu()) {
            if (!localCtx.deferred) {
                await localCtx.deferReply();
            }

            const nextCtx = new LocalCommandContext(localCtx.context, []);

            nextCtx.additionalArgs.set("values", values);
            nextCtx.additionalArgs.set("fromSearch", true);
            const playCmd = client.commands.get("play") as
                | { contextRun?: (ctx: CommandContext) => Promise<unknown> }
                | undefined;
            playCmd?.contextRun?.(nextCtx as unknown as CommandContext);

            const prev = await ctx.channel?.messages
                .fetch((localCtx.context as unknown as StringSelectMenuInteraction).message.id)
                .catch(() => void 0);
            if (prev !== undefined && prev.components.length > 0) {
                const actionRow = prev.components[0];
                if (!("components" in actionRow)) {
                    return;
                }
                const selection = actionRow.components.find(
                    (x) => x.type === ComponentType.StringSelect,
                );
                if (selection === undefined || !("customId" in selection.data)) {
                    return;
                }
                const disabledLabel = __("commands.music.search.disabledSelection");
                const disabledMenu = new StringSelectMenuBuilder()
                    .setDisabled(true)
                    .setCustomId(selection.data.customId as string)
                    .addOptions({
                        label: disabledLabel,
                        description: disabledLabel,
                        value: disabledLabel,
                    });
                await prev.edit({
                    components: [
                        new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(disabledMenu),
                    ],
                });
            }

            return;
        }

        const source =
            localCtx.options?.getString("source") ??
            (["youtube", "soundcloud"].includes(localCtx.args.at(-1)?.toLowerCase() ?? "")
                ? localCtx.args.pop()
                : "youtube");
        const query =
            (localCtx.args.join(" ") || localCtx.options?.getString("query")) ??
            (localCtx.options as CommandInteractionOptionResolver<"cached"> | null)?.getMessage(
                "message",
            )?.content;

        if ((query?.length ?? 0) === 0) {
            const noQueryMsg = await ctx.send({
                embeds: [createEmbed("warn", __("commands.music.search.noQuery"))],
            });
            if (this.isRequestChannel(client, ctx) && noQueryMsg) {
                this.autoDeleteMessage(noQueryMsg);
            }
            return;
        }
        if (checkQuery(query ?? "").isURL) {
            const playCtx = new LocalCommandContext(localCtx.context, [String(query)]);
            playCtx.additionalArgs.set("fromSearch", true);
            const playCmd2 = client.commands.get("play") as
                | { contextRun?: (ctx: CommandContext) => Promise<unknown> }
                | undefined;
            playCmd2?.contextRun?.(playCtx as unknown as CommandContext);
            return;
        }

        const tracks = await searchTrack(client, query ?? "", source as "soundcloud" | "youtube")
            .then((x) => ({ items: x.items.slice(0, 10), type: x.type }))
            .catch(() => void 0);
        if (!tracks || tracks.items.length <= 0) {
            const noTracksMsg = await ctx.reply({
                embeds: [createEmbed("error", __("commands.music.search.noTracks"), true)],
            });
            if (this.isRequestChannel(client, ctx) && noTracksMsg) {
                this.autoDeleteMessage(noTracksMsg);
            }
            return;
        }
        if (client.config.musicSelectionType === "selectmenu") {
            const selectMenuMsg = await ctx.send({
                content: __("commands.music.search.interactionContent"),
                components: [
                    new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
                        new StringSelectMenuBuilder()
                            .setMinValues(1)
                            .setMaxValues(10)
                            .setCustomId(
                                Buffer.from(`${ctx.author.id}_${this.options.name}`).toString(
                                    "base64",
                                ),
                            )
                            .addOptions(this.generateSelectMenu(tracks.items))
                            .setPlaceholder(__("commands.music.search.interactionPlaceholder")),
                    ),
                ],
            });
            if (this.isRequestChannel(client, ctx) && selectMenuMsg) {
                this.autoDeleteMessage(selectMenuMsg);
            }
            return;
        }

        const msg = await ctx.send({
            embeds: [
                createEmbed(
                    "info",
                    `${__mf("commands.music.search.queueEmbed", {
                        separator: "`,`",
                        example: "`1, 2, 3`",
                    })}\`\`\`\n${tracks.items
                        .map((x, i) => `${i + 1} - ${escapeMarkdown(parseHTMLElements(x.title))}`)
                        .join("\n")}\`\`\``,
                )
                    .setAuthor({
                        name: __("commands.music.search.trackSelectionMessage"),
                        iconURL: client.user?.displayAvatarURL(),
                    })
                    .setFooter({
                        text: `• ${__mf("commands.music.search.cancelMessage", {
                            cancel: "cancel",
                            c: "c",
                        })}`,
                    }),
            ],
        });
        let respond: Collection<string, Message> | undefined;
        const msgChannel = msg.channel;
        if (msgChannel !== null && "awaitMessages" in msgChannel) {
            try {
                respond = await msgChannel.awaitMessages({
                    errors: ["time"],
                    filter: (ms: Message) => {
                        const nums = ms.content
                            .split(/\s*,\s*/u)
                            .filter(
                                (x: string) => Number(x) > 0 && Number(x) <= tracks.items.length,
                            );

                        return (
                            ms.author.id === ctx.author.id &&
                            (["c", "cancel"].includes(ms.content.toLowerCase()) || nums.length > 0)
                        );
                    },
                    max: 1,
                });
            } catch {
                respond = undefined;
            }
        } else {
            respond = undefined;
        }
        if (respond === undefined) {
            await msg
                .delete()
                .catch((error: unknown) =>
                    this.container.logger.error("SEARCH_SELECTION_DELETE_MSG_ERR:", error),
                );
            const noSelectionMsg = await ctx.reply({
                embeds: [createEmbed("error", __("commands.music.search.noSelection"), true)],
            });
            if (this.isRequestChannel(client, ctx) && noSelectionMsg) {
                this.autoDeleteMessage(noSelectionMsg);
            }
            return;
        }
        if (["c", "cancel"].includes(respond.first()?.content.toLowerCase() ?? "")) {
            await msg
                .delete()
                .catch((error: unknown) =>
                    this.container.logger.error("SEARCH_SELECTION_DELETE_MSG_ERR:", error),
                );
            const canceledMsg = await ctx.reply({
                embeds: [createEmbed("info", __("commands.music.search.canceledMessage"))],
            });
            if (this.isRequestChannel(client, ctx) && canceledMsg) {
                this.autoDeleteMessage(canceledMsg);
            }
            return;
        }

        await msg
            .delete()
            .catch((error: unknown) =>
                this.container.logger.error("SEARCH_SELECTION_DELETE_MSG_ERR:", error),
            );
        await respond
            .first()
            ?.delete()
            .catch((error: unknown) =>
                this.container.logger.error("SEARCH_SELECTION_NUM_DELETE_MSG_ERR:", error),
            );

        const songs = respond
            .first()
            ?.content.split(/\s*,\s*/u)
            .filter((x) => Number(x) > 0 && Number(x) <= tracks.items.length)
            .sort((a, b) => Number(a) - Number(b)) as unknown as string[];
        const newCtx = new LocalCommandContext(localCtx.context, []);

        newCtx.additionalArgs.set(
            "values",
            songs.map((x) => tracks.items[Number(x) - 1].url),
        );
        newCtx.additionalArgs.set("fromSearch", true);
        const playCmd3 = client.commands.get("play") as
            | { contextRun?: (ctx: CommandContext) => Promise<unknown> }
            | undefined;
        playCmd3?.contextRun?.(newCtx as unknown as CommandContext);
    }

    private generateSelectMenu(tracks: Song[]): SelectMenuComponentOptionData[] {
        const emojis = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"];

        return tracks.slice(0, 10).map((x, i) => ({
            label: x.title.length > 98 ? `${x.title.slice(0, 97)}...` : x.title,
            emoji: emojis[i],
            value: x.url,
        }));
    }
}
