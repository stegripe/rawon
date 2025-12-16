import { AudioPlayerState, AudioResource } from "@discordjs/voice";
import { ApplicationCommandOptionType, escapeMarkdown, VoiceChannel } from "discord.js";
import i18n from "../../config/index.js";
import { BaseCommand } from "../../structures/BaseCommand.js";
import { CommandContext } from "../../structures/CommandContext.js";
import { QueueSong } from "../../typings/index.js";
import { Command } from "../../utils/decorators/Command.js";
import { haveQueue, inVC, sameVC } from "../../utils/decorators/MusicUtil.js";
import { chunk } from "../../utils/functions/chunk.js";
import { createEmbed } from "../../utils/functions/createEmbed.js";
import { parseHTMLElements } from "../../utils/functions/parseHTMLElements.js";
import { ButtonPagination } from "../../utils/structures/ButtonPagination.js";
import { SongManager } from "../../utils/structures/SongManager.js";

@Command({
    description: i18n.__("commands.music.remove.description"),
    name: "remove",
    slash: {
        options: [
            {
                description: i18n.__("commands.music.remove.slashPositionsDescription"),
                name: "positions",
                required: true,
                type: ApplicationCommandOptionType.String
            }
        ]
    },
    usage: i18n.__("commands.music.remove.usage")
})
export class RemoveCommand extends BaseCommand {
    @inVC
    @haveQueue
    @sameVC
    public async execute(ctx: CommandContext): Promise<void> {
        const djRole = await this.client.utils.fetchDJRole(ctx.guild as unknown as NonNullable<typeof ctx.guild>);
        if (
            (this.client.data.data?.[ctx.guild?.id ?? "..."]?.dj?.enable === true) &&
            (this.client.channels.cache.get(
                ctx.guild?.queue?.connection?.joinConfig.channelId ?? ""
            ) as VoiceChannel).members.size > 2 &&
            !(ctx.member?.roles.cache.has(djRole?.id ?? "") === true) &&
            !(ctx.member?.permissions.has("ManageGuild") === true)
        ) {
            void ctx.reply({
                embeds: [createEmbed("error", i18n.__("commands.music.remove.noPermission"), true)]
            });
            return;
        }

        const positions = (ctx.options?.getString("positions") ?? ctx.args.join(" ")).split(/[ ,]/u).filter(Boolean);
        if (positions.length === 0) {
            void ctx.reply({
                embeds: [createEmbed("error", i18n.__("commands.music.remove.noPositions"), true)]
            });
            return;
        }

        const cloned = [...(ctx.guild?.queue?.songs as unknown as SongManager).sortByIndex().values()];
        const songs = positions.map(x => cloned[Number.parseInt(x, 10) - 1]).filter(Boolean);
        for (const song of songs) {
            ctx.guild?.queue?.songs.delete(song.key);
        }

        const np = (
            ctx.guild?.queue?.player.state as (AudioPlayerState & { resource: AudioResource | undefined }) | undefined
        )?.resource?.metadata as QueueSong | undefined;
        const isSkip = songs.map(x => x.key).includes(np?.key ?? "");
        if (isSkip && ctx.guild?.queue) {
            if (!ctx.guild.queue.playing) {
                ctx.guild.queue.playing = true;
            }
            ctx.guild.queue.player.stop(true);
        }

        const opening = i18n.__mf("commands.music.remove.songsRemoved", {
            removed: songs.length
        });
        const pages = chunk(songs, 10).map((vals, ind) => {
            const texts = vals.map(
                (song, index) =>
                    `${isSkip ? i18n.__("commands.music.remove.songSkip") : ""}${ind * 10 + (index + 1)
                    }.) ${escapeMarkdown(parseHTMLElements(song.song.title))}`
            );

            return texts.join("\n");
        });

        const embed = createEmbed("info", `\`\`\`\n${pages[0]}\`\`\``)
            .setAuthor({
                name: opening
            })
            .setFooter({
                text: `• ${i18n.__mf("reusable.pageFooter", {
                    actual: 1,
                    total: pages.length
                })}`
            });
        const msg = await ctx.reply({ embeds: [embed] }).catch(() => void 0);

        if (!msg) return;
        void new ButtonPagination(msg, {
            author: ctx.author.id,
            edit: (i, emb, page) => {
                emb.setDescription(`\`\`\`\n${page}\`\`\``).setFooter({
                    text: `• ${i18n.__mf("reusable.pageFooter", {
                        actual: i + 1,
                        total: pages.length
                    })}`
                });
            },
            embed,
            pages
        }).start();
    }
}
