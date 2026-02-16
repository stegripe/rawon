/** biome-ignore-all lint/style/useNamingConvention: disable naming convention rule for this file */
import { type AudioPlayerState, type AudioResource } from "@discordjs/voice";
import { ApplyOptions } from "@sapphire/decorators";
import { type Command } from "@sapphire/framework";
import { type CommandContext, ContextCommand } from "@stegripe/command-context";
import {
    escapeMarkdown,
    type GuildMember,
    PermissionFlagsBits,
    type SlashCommandBuilder,
    type VoiceChannel,
} from "discord.js";
import i18n from "../../config/index.js";
import { type CommandContext as LocalCommandContext } from "../../structures/CommandContext.js";
import { type Rawon } from "../../structures/Rawon.js";
import { type QueueSong } from "../../typings/index.js";
import { haveQueue, inVC, sameVC } from "../../utils/decorators/MusicUtil.js";
import { chunk } from "../../utils/functions/chunk.js";
import { createEmbed } from "../../utils/functions/createEmbed.js";
import { i18n__, i18n__mf } from "../../utils/functions/i18n.js";
import { parseHTMLElements } from "../../utils/functions/parseHTMLElements.js";
import { ButtonPagination } from "../../utils/structures/ButtonPagination.js";
import { type SongManager } from "../../utils/structures/SongManager.js";

@ApplyOptions<Command.Options>({
    name: "remove",
    aliases: [],
    description: i18n.__("commands.music.remove.description"),
    detailedDescription: { usage: i18n.__("commands.music.remove.usage") },
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
            .setName(opts.name ?? "remove")
            .setDescription(opts.description ?? i18n.__("commands.music.remove.description"))
            .addStringOption((opt) =>
                opt
                    .setName("positions")
                    .setDescription(i18n.__("commands.music.remove.slashPositionsDescription"))
                    .setRequired(true),
            ) as SlashCommandBuilder;
    },
})
export class RemoveCommand extends ContextCommand {
    private getClient(ctx: CommandContext): Rawon {
        return ctx.client as Rawon;
    }

    @inVC
    @haveQueue
    @sameVC
    public async contextRun(ctx: CommandContext): Promise<void> {
        const localCtx = ctx as unknown as LocalCommandContext;
        const member = localCtx.member as GuildMember | null;
        const client = this.getClient(ctx);
        const __ = i18n__(client, ctx.guild);
        const __mf = i18n__mf(client, ctx.guild);

        const djRole = await client.utils.fetchDJRole(
            ctx.guild as unknown as NonNullable<typeof ctx.guild>,
        );
        if (
            client.data.data?.[ctx.guild?.id ?? "..."]?.dj?.enable === true &&
            (
                client.channels.cache.get(
                    ctx.guild?.queue?.connection?.joinConfig.channelId ?? "",
                ) as VoiceChannel
            ).members.size > 2 &&
            !(member?.roles.cache.has(djRole?.id ?? "") === true) &&
            !(member?.permissions.has("ManageGuild") === true)
        ) {
            void ctx.reply({
                embeds: [createEmbed("error", __("commands.music.remove.noPermission"), true)],
            });
            return;
        }

        const queue = ctx.guild?.queue;
        if (!queue) {
            return;
        }

        const positions = (localCtx.options?.getString("positions") ?? localCtx.args.join(" "))
            .split(/[ ,]/u)
            .filter(Boolean);
        if (positions.length === 0) {
            void ctx.reply({
                embeds: [createEmbed("warn", __("commands.music.remove.noPositions"))],
            });
            return;
        }

        const np = (
            queue.player.state as
                | (AudioPlayerState & { resource: AudioResource | undefined })
                | undefined
        )?.resource?.metadata as QueueSong | undefined;
        const full = (queue.songs as unknown as SongManager).sortByIndex();
        const displayedSongs =
            queue.loopMode === "QUEUE" ? full : full.filter((val) => val.index >= (np?.index ?? 0));
        const cloned = [...displayedSongs.values()];
        const songs = positions.map((x) => cloned[Number.parseInt(x, 10) - 1]).filter(Boolean);

        const isSkip = songs.map((x) => x.key).includes(np?.key ?? "");

        if (isSkip) {
            if (!queue.canSkip()) {
                void ctx.reply({
                    embeds: [createEmbed("warn", __("requestChannel.skipInProgress"))],
                });
                return;
            }
            if (!queue.startSkip()) {
                void ctx.reply({
                    embeds: [createEmbed("warn", __("requestChannel.skipInProgress"))],
                });
                return;
            }
        }

        for (const song of songs) {
            queue.songs.delete(song.key);
        }

        if (isSkip) {
            if (!queue.playing) {
                queue.playing = true;
            }
            queue.player.stop(true);
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
