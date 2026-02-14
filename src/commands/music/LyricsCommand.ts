/** biome-ignore-all lint/style/useNamingConvention: disable naming convention rule for this file */
import { type AudioPlayerPlayingState, type AudioResource } from "@discordjs/voice";
import { ApplyOptions } from "@sapphire/decorators";
import { type Command } from "@sapphire/framework";
import { type CommandContext, ContextCommand } from "@stegripe/command-context";
import { PermissionFlagsBits, type SlashCommandBuilder } from "discord.js";
import i18n from "../../config/index.js";
import { type CommandContext as LocalCommandContext } from "../../structures/CommandContext.js";
import { type Rawon } from "../../structures/Rawon.js";
import { type LyricsAPIResult, type QueueSong } from "../../typings/index.js";
import { chunk } from "../../utils/functions/chunk.js";
import { createEmbed } from "../../utils/functions/createEmbed.js";
import { i18n__, i18n__mf } from "../../utils/functions/i18n.js";
import { ButtonPagination } from "../../utils/structures/ButtonPagination.js";

@ApplyOptions<Command.Options>({
    name: "lyrics",
    aliases: ["ly", "lyric"],
    description: i18n.__("commands.music.lyrics.description"),
    detailedDescription: { usage: i18n.__("commands.music.lyrics.usage") },
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
            .setName(opts.name ?? "lyrics")
            .setDescription(opts.description ?? "Show the lyrics of the song.")
            .addStringOption((opt) =>
                opt
                    .setName("query")
                    .setDescription(i18n.__("commands.music.lyrics.slashDescription"))
                    .setRequired(false),
            ) as SlashCommandBuilder;
    },
})
export class LyricsCommand extends ContextCommand {
    private getClient(ctx: CommandContext): Rawon {
        return ctx.client as Rawon;
    }

    public async contextRun(ctx: CommandContext): Promise<void> {
        const localCtx = ctx as unknown as LocalCommandContext;
        const client = this.getClient(ctx);
        const __ = i18n__(client, ctx.guild);
        const __mf = i18n__mf(client, ctx.guild);

        const currentSong = (
            (ctx.guild?.queue?.player.state as AudioPlayerPlayingState).resource as
                | AudioResource
                | undefined
        )?.metadata as QueueSong | undefined;

        const userQuery =
            localCtx.args.length > 0
                ? localCtx.args.join(" ")
                : (localCtx.options?.getString("query")?.length ?? 0) > 0
                  ? (localCtx.options?.getString("query") ?? "")
                  : null;

        const query = userQuery ?? currentSong?.song.title;
        if ((query?.length ?? 0) === 0) {
            await ctx.reply({
                embeds: [createEmbed("error", __("commands.music.lyrics.noQuery"), true)],
            });

            return;
        }

        const songThumbnail = userQuery === null ? currentSong?.song.thumbnail : undefined;

        await this.getLyrics(client, ctx, query as unknown as string, songThumbnail, __, __mf);
    }

    public async fetchLyricsData(
        client: Rawon,
        song: string,
    ): Promise<LyricsAPIResult<false> | null> {
        let data: LyricsAPIResult<false> | null = null;

        try {
            const cleanSong = song
                .replaceAll(/\(.*?\)|\[.*?\]|official|video|audio|lyrics|hd|hq|mv/giu, "")
                .trim();
            const parts = cleanSong.split(/\s*[-–—]\s*/u);
            const artist = parts.length > 1 ? parts[0].trim() : "";
            const title = parts.length > 1 ? parts.slice(1).join(" ").trim() : cleanSong;

            const searchUrl = `https://lrclib.net/api/search?q=${encodeURIComponent(cleanSong)}`;
            const searchResponse = await client.request
                .get(searchUrl, { timeout: { request: 5_000 } })
                .json<Array<{ trackName: string; artistName: string; id: number }>>();

            if (Array.isArray(searchResponse) && searchResponse.length > 0) {
                let selectedTrack = searchResponse[0];

                if (artist && title) {
                    const betterMatch = searchResponse.find(
                        (track) =>
                            track.trackName.toLowerCase().includes(title.toLowerCase()) &&
                            track.artistName.toLowerCase().includes(artist.toLowerCase()),
                    );
                    if (betterMatch) {
                        selectedTrack = betterMatch;
                    }
                }

                const getUrl = `https://lrclib.net/api/get?track_name=${encodeURIComponent(selectedTrack.trackName)}&artist_name=${encodeURIComponent(selectedTrack.artistName)}`;
                const lyricsResponse = await client.request
                    .get(getUrl, { timeout: { request: 5_000 } })
                    .json<{
                        trackName?: string;
                        artistName?: string;
                        albumName?: string;
                        duration?: number;
                        instrumental?: boolean;
                        plainLyrics?: string;
                        syncedLyrics?: string;
                    }>();

                if (lyricsResponse.plainLyrics || lyricsResponse.syncedLyrics) {
                    let lyricsText = lyricsResponse.plainLyrics || "";
                    if (lyricsResponse.syncedLyrics && !lyricsText) {
                        lyricsText = lyricsResponse.syncedLyrics;
                    }
                    if (lyricsText) {
                        lyricsText = lyricsText
                            .replace(/\[(\d{1,2}:\d{2}\.\d{2,3})\]/g, "`[$1]`")
                            .trim();
                    }

                    if (lyricsText) {
                        data = {
                            lyrics: lyricsText,
                            song: lyricsResponse.trackName || selectedTrack.trackName,
                            artist: lyricsResponse.artistName || selectedTrack.artistName,
                            album_art: "https://cdn.stegripe.org/images/icon.png",
                            synced: !!lyricsResponse.syncedLyrics,
                            url: undefined,
                            error: false,
                        } as LyricsAPIResult<false>;
                    }
                }
            }
        } catch {
            // Ignore errors
        }

        return data;
    }

    public async getLyrics(
        client: Rawon,
        ctx: CommandContext,
        song: string,
        songThumbnail?: string,
        __?: ReturnType<typeof i18n__>,
        __mf?: ReturnType<typeof i18n__mf>,
    ): Promise<void> {
        const localizedI18n = __ ?? i18n__(client, ctx.guild);
        const localizedI18nMf = __mf ?? i18n__mf(client, ctx.guild);

        const loadingMsg = await ctx.reply({
            embeds: [
                createEmbed(
                    "info",
                    `🔍 **|** ${localizedI18n("commands.music.lyrics.searchingLyrics")}`,
                ),
            ],
        });

        const data = await this.fetchLyricsData(client, song);

        if (data === null || (data as { error: boolean }).error) {
            await loadingMsg.edit({
                embeds: [
                    createEmbed(
                        "warn",
                        localizedI18nMf("commands.music.lyrics.noLyrics", {
                            song: `**${song}**`,
                        }),
                    ),
                ],
            });
            return;
        }

        if ((data.lyrics?.length ?? 0) === 0) {
            await loadingMsg.edit({
                embeds: [
                    createEmbed(
                        "warn",
                        localizedI18nMf("commands.music.lyrics.noLyrics", {
                            song: `**${song}**`,
                        }),
                    ),
                ],
            });
            return;
        }

        const albumArt =
            songThumbnail ?? data.album_art ?? "https://cdn.stegripe.org/images/icon.png";
        const pages: string[] = chunk(data.lyrics ?? "", 2_048);
        const embed = createEmbed("info", pages[0])
            .setAuthor({
                name:
                    (data.song?.length ?? 0) > 0 && (data.artist?.length ?? 0) > 0
                        ? `${data.song} - ${data.artist}`
                        : song.toUpperCase(),
            })
            .setThumbnail(albumArt)
            .setFooter({
                text: `• ${localizedI18nMf("reusable.pageFooter", {
                    actual: 1,
                    total: pages.length,
                })}. ${localizedI18nMf("reusable.lyricsSource", { source: "lrclib" })}`,
            });
        await loadingMsg.edit({ embeds: [embed] });
        const msg = loadingMsg;

        await new ButtonPagination(msg, {
            author: ctx.author.id,
            edit: (i, emb, page) =>
                emb.setDescription(page).setFooter({
                    text: `• ${localizedI18nMf("reusable.pageFooter", {
                        actual: i + 1,
                        total: pages.length,
                    })}. ${localizedI18nMf("reusable.lyricsSource", { source: "lrclib" })}`,
                }),
            embed,
            pages,
        }).start();
    }
}
