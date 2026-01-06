import { type AudioPlayerState, type AudioResource } from "@discordjs/voice";
import { ApplicationCommandOptionType, escapeMarkdown, type VoiceChannel } from "discord.js";
import i18n from "../../config/index.js";
import { BaseCommand } from "../../structures/BaseCommand.js";
import { type CommandContext } from "../../structures/CommandContext.js";
import { type QueueSong } from "../../typings/index.js";
import { Command } from "../../utils/decorators/Command.js";
import { haveQueue, inVC, sameVC } from "../../utils/decorators/MusicUtil.js";
import { chunk } from "../../utils/functions/chunk.js";
import { createEmbed } from "../../utils/functions/createEmbed.js";
import { i18n__, i18n__mf } from "../../utils/functions/i18n.js";
import { parseHTMLElements } from "../../utils/functions/parseHTMLElements.js";
import { ButtonPagination } from "../../utils/structures/ButtonPagination.js";
import { type SongManager } from "../../utils/structures/SongManager.js";

@Command({
    description: i18n.__("commands.music.remove.description"),
    name: "remove",
    slash: {
        options: [
            {
                description: i18n.__("commands.music.remove.slashPositionsDescription"),
                name: "positions",
                required: true,
                type: ApplicationCommandOptionType.String,
            },
        ],
    },
    usage: i18n.__("commands.music.remove.usage"),
})
export class RemoveCommand extends BaseCommand {
    @inVC
    @haveQueue
    @sameVC
    public async execute(ctx: CommandContext): Promise<void> {
        const __ = i18n__(this.client, ctx.guild);
        const __mf = i18n__mf(this.client, ctx.guild);

        const djRole = await this.client.utils.fetchDJRole(
            ctx.guild as unknown as NonNullable<typeof ctx.guild>,
        );
        if (
            this.client.data.data?.[ctx.guild?.id ?? "..."]?.dj?.enable === true &&
            (
                this.client.channels.cache.get(
                    ctx.guild?.queue?.connection?.joinConfig.channelId ?? "",
                ) as VoiceChannel
            ).members.size > 2 &&
            !(ctx.member?.roles.cache.has(djRole?.id ?? "") === true) &&
            !(ctx.member?.permissions.has("ManageGuild") === true)
        ) {
            void ctx.reply({
                embeds: [createEmbed("error", __("commands.music.remove.noPermission"), true)],
            });
            return;
        }

        const positions = (ctx.options?.getString("positions") ?? ctx.args.join(" "))
            .split(/[ ,]/u)
            .filter(Boolean);
        if (positions.length === 0) {
            void ctx.reply({
                embeds: [createEmbed("error", __("commands.music.remove.noPositions"), true)],
            });
            return;
        }

        const np = (
            ctx.guild?.queue?.player.state as
                | (AudioPlayerState & { resource: AudioResource | undefined })
                | undefined
        )?.resource?.metadata as QueueSong | undefined;
        const full = (ctx.guild?.queue?.songs as unknown as SongManager).sortByIndex();
        // Use the same filtering as QueueCommand to match displayed positions
        const displayedSongs =
            ctx.guild?.queue?.loopMode === "QUEUE"
                ? full
                : full.filter((val) => val.index >= (np?.index ?? 0));
        const cloned = [...displayedSongs.values()];
        const songs = positions.map((x) => cloned[Number.parseInt(x, 10) - 1]).filter(Boolean);
        for (const song of songs) {
            ctx.guild?.queue?.songs.delete(song.key);
        }

        const isSkip = songs.map((x) => x.key).includes(np?.key ?? "");
        if (isSkip && ctx.guild?.queue) {
            if (!ctx.guild.queue.playing) {
                ctx.guild.queue.playing = true;
            }
            ctx.guild.queue.player.stop(true);
        }

        const opening = __mf("commands.music.remove.songsRemoved", {
            removed: songs.length,
        });
        const pages = chunk(songs, 10).map((vals, ind) => {
            const texts = vals.map(
                (song, index) =>
                    `${isSkip ? __("commands.music.remove.songSkip") : ""}${
                        ind * 10 + (index + 1)
                    }.) **[${escapeMarkdown(parseHTMLElements(song.song.title))}](${song.song.url})**`,
            );

            return texts.join("\n");
        });

        const firstSong = songs[0];
        const embed = createEmbed("info", pages[0])
            .setAuthor({
                name: opening,
            })
            .setFooter({
                text: `• ${__mf("reusable.pageFooter", {
                    actual: 1,
                    total: pages.length,
                })}`,
            });
        if (firstSong?.song.thumbnail) {
            embed.setThumbnail(firstSong.song.thumbnail);
        }
        const msg = await ctx.reply({ embeds: [embed] }).catch(() => void 0);

        if (!msg) {
            return;
        }
        void new ButtonPagination(msg, {
            author: ctx.author.id,
            edit: (i, emb, page) => {
                emb.setDescription(page).setFooter({
                    text: `• ${__mf("reusable.pageFooter", {
                        actual: i + 1,
                        total: pages.length,
                    })}`,
                });
            },
            embed,
            pages,
        }).start();
    }
}
