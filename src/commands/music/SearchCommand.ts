import { checkQuery, searchTrack } from "../../utils/handlers/GeneralUtil";
import { inVC, validVC, sameVC } from "../../utils/decorators/MusicUtil";
import { parseHTMLElements } from "../../utils/parseHTMLElements";
import { CommandContext } from "../../structures/CommandContext";
import { BaseCommand } from "../../structures/BaseCommand";
import { createEmbed } from "../../utils/createEmbed";
import { ISong } from "../../typings";
import i18n from "../../config";
import { CommandInteractionOptionResolver, Message, MessageActionRow, MessageSelectOptionData, MessageSelectMenu, SelectMenuInteraction, Util } from "discord.js";

export class SearchCommand extends BaseCommand {
    public constructor(client: BaseCommand["client"]) {
        super(client, {
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
                        type: "STRING"
                    },
                    {
                        choices: [
                            {
                                name: "YouTube",
                                value: "youtube"
                            },
                            {
                                name: "SoundCloud",
                                value: "soundcloud"
                            }
                        ],
                        description: i18n.__("commands.music.search.slashSourceDescription"),
                        name: "source",
                        required: false,
                        type: "STRING"
                    }
                ]
            },
            usage: i18n.__("commands.music.search.usage")
        });
    }

    public async execute(ctx: CommandContext): Promise<Message|void> {
        if (!inVC(ctx)) return;
        if (!validVC(ctx)) return;
        if (!sameVC(ctx)) return;
        if (ctx.isInteraction() && !ctx.deferred) await ctx.deferReply();

        const values = ctx.additionalArgs.get("values");
        if (values && ctx.isSelectMenu()) {
            if (!ctx.deferred) await ctx.deferReply();
            const newCtx = new CommandContext(ctx.context, []);
            newCtx.additionalArgs.set("values", values);
            newCtx.additionalArgs.set("fromSearch", true);
            this.client.commands.get("play")!.execute(newCtx);
            const msg = await ctx.channel!.messages.fetch((ctx.context as SelectMenuInteraction).message.id).catch(() => undefined);
            if (msg !== undefined) {
                const selection = msg.components[0].components.find(x => x.type === "SELECT_MENU");
                selection!.setDisabled(true);
                await msg.edit({ components: [new MessageActionRow().addComponents(selection!)] });
            }
            return;
        }
        const source = ctx.options?.getString("source") ?? (["youtube", "soundcloud"].includes(ctx.args.slice(-1)[0]?.toLowerCase()) ? ctx.args.pop()! : "youtube");
        const query = (ctx.args.join(" ") || ctx.options?.getString("query")) ?? (ctx.options as CommandInteractionOptionResolver<"present">|null)?.getMessage("message")?.content;

        if (!query) {
            return ctx.send({
                embeds: [
                    createEmbed("warn", i18n.__("commands.music.search.noQuery"))
                ]
            });
        }
        if (checkQuery(query).isURL) {
            const newCtx = new CommandContext(ctx.context, [String(query)]);
            return this.client.commands.get("play")!.execute(newCtx);
        }

        const tracks = await searchTrack(this.client, query, source as "youtube" | "soundcloud").then(x => ({ items: x.items.slice(0, 10), type: x.type })).catch(() => undefined);
        if (!tracks || (tracks.items.length <= 0)) return ctx.reply({ embeds: [createEmbed("error", i18n.__("commands.music.search.noTracks"), true)] });
        if (this.client.config.musicSelectionType === "selectmenu") {
            return ctx.send({
                content: i18n.__("commands.music.search.interactionContent"),
                components: [
                    new MessageActionRow()
                        .addComponents(
                            new MessageSelectMenu()
                                .setMinValues(1)
                                .setMaxValues(10)
                                .setCustomId(Buffer.from(`${ctx.author.id}_${this.meta.name}`).toString("base64"))
                                .addOptions(this.generateSelectMenu(tracks.items))
                                .setPlaceholder(i18n.__("commands.music.search.interactionPlaceholder"))
                        )
                ]
            });
        }

        const msg = await ctx.send({
            embeds: [
                createEmbed("info", `${i18n.__mf("commands.music.search.queueEmbed", { separator: `\`,\``, example: `\`1, 2, 3\`` })}\`\`\`\n${tracks.items.map((x, i) => `${i + 1} - ${Util.escapeMarkdown(parseHTMLElements(x.title))}`).join("\n")}\`\`\``)
                    .setAuthor(i18n.__("commands.music.search.trackSelectionMessage"), this.client.user?.displayAvatarURL())
                    .setFooter(i18n.__mf("commands.music.search.cancelMessage", { cancel: "cancel", c: "c" }))
            ]
        });
        const respond = await msg.channel.awaitMessages({
            errors: ["time"],
            filter: m => {
                const nums = m.content.split(/, /).filter(x => Number(x) > 0 && Number(x) <= tracks.items.length);

                return (m.author.id === ctx.author.id) && (["c", "cancel"].includes(m.content.toLowerCase()) || (nums.length >= 1));
            },
            max: 1
        }).catch(() => undefined);
        if (!respond) {
            msg.delete().catch(err => this.client.logger.error("SEARCH_SELECTION_DELETE_MSG_ERR:", err));
            return ctx.reply({ embeds: [createEmbed("error", i18n.__("commands.music.search.noSelection"), true)] });
        }
        if (["c", "cancel"].includes(respond.first()?.content.toLowerCase() as string)) {
            msg.delete().catch(err => this.client.logger.error("SEARCH_SELECTION_DELETE_MSG_ERR:", err));
            return ctx.reply({ embeds: [createEmbed("info", i18n.__("commands.music.search.canceledMessage"), true)] });
        }

        msg.delete().catch(err => this.client.logger.error("SEARCH_SELECTION_DELETE_MSG_ERR:", err));
        respond.first()?.delete().catch(err => this.client.logger.error("SEARCH_SELECTION_NUM_DELETE_MSG_ERR:", err));

        const songs = respond.first()!.content
            .split(/, /).filter(x => Number(x) > 0 && Number(x) <= tracks.items.length)
            .sort((a, b) => Number(a) - Number(b));
        const newCtx = new CommandContext(ctx.context, []);
        newCtx.additionalArgs.set("values", [await Promise.all(songs.map(x => tracks.items[Number(x) - 1].url))]);
        newCtx.additionalArgs.set("fromSearch", true);
        this.client.commands.get("play")!.execute(newCtx);
    }

    private generateSelectMenu(tracks: ISong[]): MessageSelectOptionData[] {
        const emojis = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"];

        return tracks.slice(0, 10).map((x, i) => (
            {
                label: x.title.length > 98 ? `${x.title.substr(0, 97)}...` : x.title,
                emoji: emojis[i],
                value: x.url
            }
        ));
    }
}
