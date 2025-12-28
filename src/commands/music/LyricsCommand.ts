import { type AudioPlayerPlayingState, type AudioResource } from "@discordjs/voice";
import { ApplicationCommandOptionType } from "discord.js";
import i18n from "../../config/index.js";
import { BaseCommand } from "../../structures/BaseCommand.js";
import { type CommandContext } from "../../structures/CommandContext.js";
import { type LyricsAPIResult, type QueueSong } from "../../typings/index.js";
import { Command } from "../../utils/decorators/Command.js";
import { chunk } from "../../utils/functions/chunk.js";
import { createEmbed } from "../../utils/functions/createEmbed.js";
import { ButtonPagination } from "../../utils/structures/ButtonPagination.js";

@Command<typeof LyricsCommand>({
    aliases: ["ly", "lyric"],
    description: i18n.__("commands.music.lyrics.description"),
    name: "lyrics",
    slash: {
        options: [
            {
                description: i18n.__("commands.music.lyrics.slashDescription"),
                name: "query",
                type: ApplicationCommandOptionType.String,
                required: false,
            },
        ],
    },
    usage: i18n.__("commands.music.lyrics.usage"),
})
export class LyricsCommand extends BaseCommand {
    public async execute(ctx: CommandContext): Promise<void> {
        const currentSong = (
            (ctx.guild?.queue?.player.state as AudioPlayerPlayingState).resource as
                | AudioResource
                | undefined
        )?.metadata as QueueSong | undefined;

        const userQuery =
            ctx.args.length > 0
                ? ctx.args.join(" ")
                : (ctx.options?.getString("query")?.length ?? 0) > 0
                  ? (ctx.options?.getString("query") ?? "")
                  : null;

        const query = userQuery ?? currentSong?.song.title;
        if ((query?.length ?? 0) === 0) {
            await ctx.reply({
                embeds: [createEmbed("error", i18n.__("commands.music.lyrics.noQuery"), true)],
            });

            return;
        }

        const songThumbnail = userQuery === null ? currentSong?.song.thumbnail : undefined;

        await this.getLyrics(ctx, query as unknown as string, songThumbnail);
    }

    public async fetchLyricsData(song: string): Promise<LyricsAPIResult<false> | null> {
        let data: LyricsAPIResult<false> | null = null;

        try {
            const cleanSong = song
                .replaceAll(/\(.*?\)|\[.*?\]|official|video|audio|lyrics|hd|hq|mv/giu, "")
                .trim();
            const parts = cleanSong.split(/\s*[-–—]\s*/u);
            const artist = parts.length > 1 ? parts[0].trim() : "";
            const title = parts.length > 1 ? parts.slice(1).join(" ").trim() : cleanSong;

            const searchUrl = `https://lrclib.net/api/search?q=${encodeURIComponent(cleanSong)}`;
            const searchResponse = await this.client.request
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
                const lyricsResponse = await this.client.request
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
        ctx: CommandContext,
        song: string,
        songThumbnail?: string,
    ): Promise<void> {
        const loadingMsg = await ctx.reply({
            embeds: [
                createEmbed("info", `🔍 **|** ${i18n.__("commands.music.lyrics.searchingLyrics")}`),
            ],
        });

        const data = await this.fetchLyricsData(song);

        if (data === null || (data as { error: boolean }).error) {
            await loadingMsg.edit({
                embeds: [
                    createEmbed(
                        "warn",
                        i18n.__mf("commands.music.lyrics.noLyrics", {
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
                        i18n.__mf("commands.music.lyrics.noLyrics", {
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
                text: `• ${i18n.__mf("reusable.pageFooter", {
                    actual: 1,
                    total: pages.length,
                })}. ${i18n.__mf("reusable.lyricsSource", { source: "lrclib" })}`,
            });
        await loadingMsg.edit({ embeds: [embed] });
        const msg = loadingMsg;

        await new ButtonPagination(msg, {
            author: ctx.author.id,
            edit: (i, emb, page) =>
                emb.setDescription(page).setFooter({
                    text: `• ${i18n.__mf("reusable.pageFooter", {
                        actual: i + 1,
                        total: pages.length,
                    })}. ${i18n.__mf("reusable.lyricsSource", { source: "lrclib" })}`,
                }),
            embed,
            pages,
        }).start();
    }
}
