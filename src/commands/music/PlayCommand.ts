import { checkQuery, searchTrack } from "../../utils/handlers/GeneralUtil";
import { inVC, sameVC, validVC } from "../../utils/decorators/MusicUtil";
import { DefineCommand } from "../../utils/decorators/DefineCommand";
import { CommandContext } from "../../structures/CommandContext";
import { ButtonPagination } from "../../utils/ButtonPagination";
import { BaseCommand } from "../../structures/BaseCommand";
import { ServerQueue } from "../../structures/ServerQueue";
import { getStream } from "../../utils/handlers/YTDLUtil";
import { createEmbed } from "../../utils/createEmbed";
import { IQueueSong, ISong } from "../../typings";
import { chunk } from "../../utils/chunk";
import { AudioPlayerError, AudioPlayerPlayingState, AudioPlayerStatus, createAudioPlayer, createAudioResource, demuxProbe, entersState, joinVoiceChannel, VoiceConnectionStatus } from "@discordjs/voice";
import { MessageSelectMenu, MessageActionRow, Util, Guild } from "discord.js";
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
            if (checkRes.isURL) return ctx.reply({ embeds: [createEmbed("warn", "That URL doesn't have a song data.")] });

            return ctx.reply({ embeds: [createEmbed("warn", "I couldn't obtain any search results.")] });
        }

        let toQueue = songs.items;
        if (songs.type === "selection") {
            const selectMenu = new MessageSelectMenu()
                .setCustomId("MUSIC_SELECTION")
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

            const opening = `**Added ${toQueue.length} songs to the queue**\n\n`;
            const pages = await Promise.all(chunk(toQueue, 10).map(async (v, i) => {
                const texts = await Promise.all(v.map((song, index) => `${(i * 10) + (index + 1)} - [${Util.escapeMarkdown(decodeHTML(song.title))}](${song.url})`));

                return texts.join("\n");
            }));
            const embed = createEmbed("info", opening);

            return new ButtonPagination(ctx.context, {
                author: ctx.author.id,
                edit: (i, e, p) => {
                    embed.setDescription(`${opening}${p}`);
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
    }

    private async play(guild: Guild, nextSong?: string): Promise<void> {
        const queue = guild.queue;
        if (!queue) return;
        if (queue.player === null) queue.player = createAudioPlayer();

        const song = nextSong ? queue.songs.get(nextSong)! : queue.songs.first()!;
        const probe = await demuxProbe(await getStream(song.song.url));
        const resource = createAudioResource(probe.stream, { inlineVolume: true, inputType: probe.type, metadata: song });

        queue.connection?.subscribe(queue.player);

        entersState(queue.connection!, VoiceConnectionStatus.Ready, 15000)
            .then(() => queue.player?.play(resource))
            .catch((err: Error) => {
                if (err.message === "The operation was aborted") err.message = "I couldn't establish a voice connection within 15 seconds.";
                queue.player?.emit("error", new AudioPlayerError(err, resource));
            });

        queue.player.on("stateChange", (oldState, newState) => {
            if ((newState.status === AudioPlayerStatus.Playing) && (oldState.status !== AudioPlayerStatus.Paused)) {
                const newSong = ((queue.player!.state as AudioPlayerPlayingState).resource.metadata as IQueueSong).song;
                this.client.logger.info(`${this.client.shard ? `[Shard #${this.client.shard.ids[0]}]` : ""} Track: "${newSong.title}" on ${guild.name} has started`);
                queue.textChannel.send({ embeds: [createEmbed("info", `▶ **|** Started playing **[${newSong.title}](${newSong.url})**`).setThumbnail(newSong.thumbnail)] })
                    .then(m => queue.lastMusicMsg = m.id)
                    .catch(e => this.client.logger.error("PLAY_ERR:", e));
            } else if (newState.status === AudioPlayerStatus.Idle) {
                this.client.logger.info(`${this.client.shard ? `[Shard #${this.client.shard.ids[0]}]` : ""} Track: "${song.song.title}" on ${guild.name} has ended`);
                if (queue.loopMode === "OFF") {
                    queue.songs.delete(song.key);
                }

                const nextSong = (queue.shuffle && (queue.loopMode !== "SONG")) ? queue.songs.random() : (queue.loopMode === "SONG" ? queue.songs.get(song.key) : queue.songs.sort((a, b) => a.index - b.index).filter(x => x.index > song.index).first() ?? queue.songs.sort((a, b) => a.index - b.index).first());

                queue.textChannel.send({ embeds: [createEmbed("info", `⏹ **|** Stopped playing **[${song.song.title}](${song.song.url})**`).setThumbnail(song.song.thumbnail)] })
                    .then(m => queue.lastMusicMsg = m.id)
                    .catch(e => this.client.logger.error("PLAY_ERR:", e))
                    .finally(() => {
                        queue.player = null;
                        this.play(guild, nextSong?.key).catch(e => {
                            queue.textChannel.send({ embeds: [createEmbed("error", `An error occurred while trying to play music, because: \`${e}\``)] })
                                .catch(e => this.client.logger.error("PLAY_ERR:", e));
                            queue.connection?.disconnect();
                            return this.client.logger.error("PLAY_ERR:", e);
                        });
                    });
            }
        })
            .on("error", err => {
                queue.textChannel.send({ embeds: [createEmbed("error", `An error occurred while trying to play music, because: \`${err.message}\``)] }).catch(e => this.client.logger.error("PLAY_CMD_ERR:", e));
                queue.connection?.disconnect();
                delete guild.queue;
                this.client.logger.error("PLAY_ERR:", err);
            });
    }
}
