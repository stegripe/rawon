import { checkQuery, handleVideos, searchTrack } from "../../utils/handlers/GeneralUtil";
import { inVC, validVC, sameVC } from "../../utils/decorators/MusicUtil";
import { DefineCommand } from "../../utils/decorators/DefineCommand";
import { CommandContext } from "../../structures/CommandContext";
import { BaseCommand } from "../../structures/BaseCommand";
import { createEmbed } from "../../utils/createEmbed";
import { ISong } from "../../typings";
import { MessageActionRow, MessageSelectOptionData, MessageSelectMenu, Util } from "discord.js";
import { decodeHTML } from "entities";

@DefineCommand({
    contextChat: "Add to queue",
    description: "Play some music using provided query",
    name: "search",
    slash: {
        description: "Search the specified music",
        options: [
            {
                description: "Query to search",
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
                description: "Where the track should be taken?",
                name: "source",
                required: false,
                type: "STRING"
            }
        ]
    },
    usage: "{prefix}search <query> [source]"
})
export class SearchCommand extends BaseCommand {
    @inVC()
    @validVC()
    @sameVC()
    public async execute(ctx: CommandContext): Promise<any> {
        if (ctx.isInteraction() && !ctx.deferred) await ctx.deferReply();

        const voiceChannel = ctx.member!.voice.channel!;
        const source = ctx.options?.getString("source") ?? (["youtube", "soundcloud"].includes(ctx.args.slice(-1)[0]?.toLowerCase()) ? ctx.args.pop()! : "youtube");
        const query = (ctx.args.join(" ") || ctx.options?.getString("query")) ?? ctx.options?.getMessage("message")?.content;

        if (!query) {
            return ctx.send({
                embeds: [
                    createEmbed("warn", "Please provide some query to search.")
                ]
            });
        }
        if (checkQuery(query).isURL) {
            const newCtx = new CommandContext(ctx.context, [String(query)]);
            return this.client.commands.get("play")!.execute(newCtx);
        }

        const tracks = await searchTrack(this.client, query, source as "youtube"|"soundcloud").catch(() => undefined);
        if (!tracks || (tracks.items.length <= 0)) return ctx.reply({ embeds: [createEmbed("error", "I can't obtain any search results.", true)] });

        let toQueue: ISong[];
        if (this.client.config.musicSelectionType === "message") {
            const msg = await ctx.send({
                embeds: [
                    createEmbed("info", `Please select some music.\nYou can choose more than one using blank space or \`,\`. For example: \`1,2, 3\`\n\`\`\`\n${tracks.items.map((x, i) => `${i + i} - ${Util.escapeMarkdown(decodeHTML(x.title))}`).join("\n")}\`\`\``)
                        .setAuthor("Tracks Selection", this.client.user?.displayAvatarURL())
                        .setFooter("Type cancel or c to cancel tracks selection.")
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
            if (!respond) return ctx.reply({ embeds: [createEmbed("error", "No or invalid value entered, tracks selection canceled.")] });
            if (["c", "cancel"].includes(respond.first()?.content.toLowerCase() as string)) return ctx.reply({ embeds: [createEmbed("info", "Tracks selection canceled.")] });

            const songs = respond.first()!.content
                .split(/, /).filter(x => Number(x) > 0 && Number(x) <= tracks.items.length)
                .sort((a, b) => Number(a) - Number(b));

            toQueue = await Promise.all(songs.map(x => tracks.items[Number(x) - 1]));
        } else {
            const msg = await ctx.send({
                content: "Please select some music",
                components: [
                    new MessageActionRow()
                        .addComponents(
                            new MessageSelectMenu()
                                .setMinValues(1)
                                .setMaxValues(10)
                                .setCustomId(Buffer.from(`${ctx.author.id}_${this.meta.name}_no`).toString("base64"))
                                .addOptions(this.generateSelectMenu(tracks.items))
                                .setPlaceholder("Select some tracks")
                        )
                ]
            });
            toQueue = await (new Promise(resolve => {
                const collector = msg.createMessageComponentCollector({
                    filter: i => i.isSelectMenu() && (i.user.id === ctx.author.id),
                    max: 1
                });

                collector.on("collect", i => {
                    if (!i.isSelectMenu()) return;

                    resolve(i.values.map(val => {
                        const num = Number(val.slice(-1));

                        return tracks.items[num];
                    }));
                });
            }));
        }

        return handleVideos(this.client, ctx, toQueue, voiceChannel);
    }

    private generateSelectMenu(tracks: ISong[]): MessageSelectOptionData[] {
        const emojis = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"];

        return tracks.slice(0, 10).map((x, i) => (
            {
                label: x.title.length > 98 ? `${x.title.substr(0, 97)}...` : x.title,
                emoji: emojis[i],
                value: `MUSIC-${i}`
            }
        ));
    }
}
