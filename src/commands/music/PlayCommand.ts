import { checkQuery, play, searchTrack } from "../../utils/handlers/GeneralUtil";
import { inVC, sameVC, validVC } from "../../utils/decorators/MusicUtil";
import { DefineCommand } from "../../utils/decorators/DefineCommand";
import { CommandContext } from "../../structures/CommandContext";
import { ButtonPagination } from "../../utils/ButtonPagination";
import { BaseCommand } from "../../structures/BaseCommand";
import { ServerQueue } from "../../structures/ServerQueue";
import { createEmbed } from "../../utils/createEmbed";
import { ISong } from "../../typings";
import { chunk } from "../../utils/chunk";
import { joinVoiceChannel } from "@discordjs/voice";
import { MessageSelectMenu, MessageActionRow, Util } from "discord.js";
import { decodeHTML } from "entities";

@DefineCommand({
    description: "Play some music",
    name: "play",
    slash: {
        description: "Play some music",
        name: "play",
        options: [
            {
                description: "Query to search",
                name: "query",
                type: "STRING"
            }
        ]
    }
})
export class PlayCommand extends BaseCommand {
    @inVC()
    @validVC()
    @sameVC()
    public async execute(ctx: CommandContext): Promise<any> {
        if (ctx.isInteraction() && !ctx.deferred) await ctx.deferReply();

        const voiceChannel = ctx.member!.voice.channel!;
        const query = ((ctx.args.length ? ctx.args.join(" ") : undefined) ?? ctx.options?.getString("query")) ?? (ctx.additionalArgs.get("values") ? ctx.additionalArgs.get("values")[0] : undefined) as string|undefined;

        if (!query) {
            return ctx.reply({
                embeds: [createEmbed("warn", `Invalid usage, please use **\`${this.client.config.prefix}help ${this.meta.name}\`** for more information.`)]
            });
        }

        const url = query.replace(/<(.+)>/g, "$1");
        const checkRes = checkQuery(url);

        if (ctx.guild?.queue && voiceChannel.id !== ctx.guild.queue.connection?.joinConfig.channelId) {
            return ctx.reply({ embeds: [createEmbed("warn", `The music player is already playing to **${ctx.guild.channels.cache.get(ctx.guild.queue.connection?.joinConfig.channelId as string)?.name ?? "#unknown-channel"}** voice channel.`)] });
        }

        const songs = await searchTrack(url).catch(() => undefined);
        if (!songs || (songs.items.length <= 0)) {
            if (checkRes.isURL) return ctx.reply({ embeds: [createEmbed("error", "That URL doesn't have a song data.", true)] });

            return ctx.reply({ embeds: [createEmbed("error", "I couldn't obtain any search results.", true)] });
        }

        let toQueue = songs.items;
        if (songs.type === "selection") {
            const selectMenu = new MessageSelectMenu()
                .setCustomId(Buffer.from(`${ctx.author.id}_${this.meta.name}_no`).toString("base64"))
                .addOptions(toQueue.map((v, i) => ({
                    label: (v.title.length > 100) ? `${v.title.slice(0, 100)}...` : v.title,
                    value: `MUSIC-${i}`
                })));
            const row = new MessageActionRow().addComponents(selectMenu);
            const msg = await ctx.reply({ content: "Please select one of the results", components: [row] });

            toQueue = await (new Promise(resolve => {
                msg.createMessageComponentCollector({
                    filter: i => i.isSelectMenu(),
                    max: 1
                }).on("collect", i => {
                    if (!i.isSelectMenu()) return;

                    const tracks = i.values.map((x): ISong => {
                        const index = x.slice(-1);

                        return toQueue[Number(index)];
                    });

                    resolve(tracks);
                });
            }));
        }

        async function sendPagination(): Promise<any> {
            for (const song of toQueue) {
                ctx.guild?.queue?.songs.addSong(song);
            }

            const opening = `**Added \`${toQueue.length}\` songs to the queue**\n\n`;
            const pages = await Promise.all(chunk(toQueue, 10).map(async (v, i) => {
                const texts = await Promise.all(v.map((song, index) => `${(i * 10) + (index + 1)} - [${Util.escapeMarkdown(decodeHTML(song.title))}](${song.url})`));

                return texts.join("\n");
            }));
            const embed = createEmbed("info", opening);
            const msg = await ctx.reply({ embeds: [embed] }, true);

            return new ButtonPagination(msg, {
                author: ctx.author.id,
                edit: (i, e, p) => {
                    e.setDescription(`${opening}${p}`).setFooter(`Page ${i + 1}/${pages.length}`);
                },
                embed,
                pages
            }).start();
        }

        if (ctx.guild?.queue) {
            return sendPagination();
        }

        ctx.guild!.queue = new ServerQueue(ctx.channel!);
        await sendPagination();

        try {
            const connection = joinVoiceChannel({
                adapterCreator: ctx.guild!.voiceAdapterCreator,
                channelId: voiceChannel.id,
                guildId: ctx.guild!.id,
                selfDeaf: true
            });
            ctx.guild!.queue.connection = connection;
        } catch (error) {
            ctx.guild?.queue.songs.clear();
            delete ctx.guild!.queue;

            this.client.logger.error("PLAY_CMD_ERR:", error);
            return ctx.channel!.send({
                embeds: [createEmbed("error", `I couldn't join the voice channel, because: \`${(error as Error).message}\``)]
            }).catch(e => this.client.logger.error("PLAY_CMD_ERR:", e));
        }

        void play(this.client, ctx.guild!);
    }
}
