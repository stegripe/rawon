import { Buffer } from "node:buffer";
import { setTimeout } from "node:timers";
import {
    ActionRowBuilder,
    ApplicationCommandOptionType,
    type Collection,
    type CommandInteractionOptionResolver,
    ComponentType,
    escapeMarkdown,
    type Message,
    type SelectMenuComponentOptionData,
    StringSelectMenuBuilder,
    type StringSelectMenuInteraction,
} from "discord.js";
import i18n from "../../config/index.js";
import { BaseCommand } from "../../structures/BaseCommand.js";
import { CommandContext } from "../../structures/CommandContext.js";
import { type Song } from "../../typings/index.js";
import { Command } from "../../utils/decorators/Command.js";
import { inVC, sameVC, validVC } from "../../utils/decorators/MusicUtil.js";
import { createEmbed } from "../../utils/functions/createEmbed.js";
import { parseHTMLElements } from "../../utils/functions/parseHTMLElements.js";
import { checkQuery, searchTrack } from "../../utils/handlers/GeneralUtil.js";

@Command<typeof SearchCommand>({
    aliases: ["sc"],
    contextChat: "Add to queue",
    description: i18n.__("commands.music.search.description"),
    name: "search",
    slash: {
        description: i18n.__("commands.music.search.slashDescription"),
        options: [
            {
                description: i18n.__("commands.music.search.slashQueryDescription"),
                name: "query",
                type: ApplicationCommandOptionType.String,
            },
            {
                choices: [
                    {
                        name: "YouTube",
                        value: "youtube",
                    },
                    {
                        name: "SoundCloud",
                        value: "soundcloud",
                    },
                ],
                description: i18n.__("commands.music.search.slashSourceDescription"),
                name: "source",
                required: false,
                type: ApplicationCommandOptionType.String,
            },
        ],
    },
    usage: i18n.__("commands.music.search.usage"),
})
export class SearchCommand extends BaseCommand {
    private isRequestChannel(ctx: CommandContext): boolean {
        if (!ctx.guild) {
            return false;
        }
        const requestChannel = this.client.requestChannelManager.getRequestChannel(ctx.guild);
        return requestChannel !== null && ctx.channel?.id === requestChannel.id;
    }

    private autoDeleteMessage(msg: Message, delay = 60_000): void {
        setTimeout(() => {
            msg.delete().catch(() => null);
        }, delay);
    }

    @inVC
    @validVC
    @sameVC
    public async execute(ctx: CommandContext): Promise<Message | undefined> {
        if (ctx.isInteraction() && !ctx.deferred) {
            await ctx.deferReply();
        }

        const values = ctx.additionalArgs.get("values") as string[] | undefined;
        if (values && ctx.isStringSelectMenu()) {
            if (!ctx.deferred) {
                await ctx.deferReply();
            }

            const nextCtx = new CommandContext(ctx.context, []);

            nextCtx.additionalArgs.set("values", values);
            nextCtx.additionalArgs.set("fromSearch", true);
            this.client.commands.get("play")?.execute(nextCtx);

            const prev = await ctx.channel?.messages
                .fetch((ctx.context as StringSelectMenuInteraction).message.id)
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
                const disabledMenu = new StringSelectMenuBuilder()
                    .setDisabled(true)
                    .setCustomId(selection.data.customId as string)
                    .addOptions({
                        label: "Nothing to select here",
                        description: "Nothing to select here",
                        value: "Nothing to select here",
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
            ctx.options?.getString("source") ??
            (["youtube", "soundcloud"].includes(ctx.args.at(-1)?.toLowerCase() ?? "")
                ? ctx.args.pop()
                : "youtube");
        const query =
            (ctx.args.join(" ") || ctx.options?.getString("query")) ??
            (ctx.options as CommandInteractionOptionResolver<"cached"> | null)?.getMessage(
                "message",
            )?.content;

        if ((query?.length ?? 0) === 0) {
            const noQueryMsg = await ctx.send({
                embeds: [createEmbed("warn", i18n.__("commands.music.search.noQuery"))],
            });
            if (this.isRequestChannel(ctx) && noQueryMsg) {
                this.autoDeleteMessage(noQueryMsg);
            }
            return;
        }
        if (checkQuery(query ?? "").isURL) {
            const playCtx = new CommandContext(ctx.context, [String(query)]);
            playCtx.additionalArgs.set("fromSearch", true);
            this.client.commands.get("play")?.execute(playCtx);
            return;
        }

        const tracks = await searchTrack(
            this.client,
            query ?? "",
            source as "soundcloud" | "youtube",
        )
            .then((x) => ({ items: x.items.slice(0, 10), type: x.type }))
            .catch(() => void 0);
        if (!tracks || tracks.items.length <= 0) {
            const noTracksMsg = await ctx.reply({
                embeds: [createEmbed("error", i18n.__("commands.music.search.noTracks"), true)],
            });
            if (this.isRequestChannel(ctx) && noTracksMsg) {
                this.autoDeleteMessage(noTracksMsg);
            }
            return;
        }
        if (this.client.config.musicSelectionType === "selectmenu") {
            const selectMenuMsg = await ctx.send({
                content: i18n.__("commands.music.search.interactionContent"),
                components: [
                    new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
                        new StringSelectMenuBuilder()
                            .setMinValues(1)
                            .setMaxValues(10)
                            .setCustomId(
                                Buffer.from(`${ctx.author.id}_${this.meta.name}`).toString(
                                    "base64",
                                ),
                            )
                            .addOptions(this.generateSelectMenu(tracks.items))
                            .setPlaceholder(
                                i18n.__("commands.music.search.interactionPlaceholder"),
                            ),
                    ),
                ],
            });
            if (this.isRequestChannel(ctx) && selectMenuMsg) {
                this.autoDeleteMessage(selectMenuMsg);
            }
            return;
        }

        const msg = await ctx.send({
            embeds: [
                createEmbed(
                    "info",
                    `${i18n.__mf("commands.music.search.queueEmbed", {
                        separator: "`,`",
                        example: "`1, 2, 3`",
                    })}\`\`\`\n${tracks.items
                        .map((x, i) => `${i + 1} - ${escapeMarkdown(parseHTMLElements(x.title))}`)
                        .join("\n")}\`\`\``,
                )
                    .setAuthor({
                        name: i18n.__("commands.music.search.trackSelectionMessage"),
                        iconURL: this.client.user?.displayAvatarURL(),
                    })
                    .setFooter({
                        text: i18n.__mf("commands.music.search.cancelMessage", {
                            cancel: "cancel",
                            c: "c",
                        }),
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
                    this.client.logger.error("SEARCH_SELECTION_DELETE_MSG_ERR:", error),
                );
            const noSelectionMsg = await ctx.reply({
                embeds: [createEmbed("error", i18n.__("commands.music.search.noSelection"), true)],
            });
            if (this.isRequestChannel(ctx) && noSelectionMsg) {
                this.autoDeleteMessage(noSelectionMsg);
            }
            return;
        }
        if (["c", "cancel"].includes(respond.first()?.content.toLowerCase() ?? "")) {
            await msg
                .delete()
                .catch((error: unknown) =>
                    this.client.logger.error("SEARCH_SELECTION_DELETE_MSG_ERR:", error),
                );
            const canceledMsg = await ctx.reply({
                embeds: [
                    createEmbed("info", i18n.__("commands.music.search.canceledMessage"), true),
                ],
            });
            if (this.isRequestChannel(ctx) && canceledMsg) {
                this.autoDeleteMessage(canceledMsg);
            }
            return;
        }

        await msg
            .delete()
            .catch((error: unknown) =>
                this.client.logger.error("SEARCH_SELECTION_DELETE_MSG_ERR:", error),
            );
        await respond
            .first()
            ?.delete()
            .catch((error: unknown) =>
                this.client.logger.error("SEARCH_SELECTION_NUM_DELETE_MSG_ERR:", error),
            );

        const songs = respond
            .first()
            ?.content.split(/\s*,\s*/u)
            .filter((x) => Number(x) > 0 && Number(x) <= tracks.items.length)
            .sort((a, b) => Number(a) - Number(b)) as unknown as string[];
        const newCtx = new CommandContext(ctx.context, []);

        newCtx.additionalArgs.set(
            "values",
            songs.map((x) => tracks.items[Number(x) - 1].url),
        );
        newCtx.additionalArgs.set("fromSearch", true);
        this.client.commands.get("play")?.execute(newCtx);
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
