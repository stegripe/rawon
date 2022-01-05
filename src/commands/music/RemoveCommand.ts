import { haveQueue, inVC, sameVC } from "../../utils/decorators/MusicUtil";
import { parseHTMLElements } from "../../utils/parseHTMLElements";
import { CommandContext } from "../../structures/CommandContext";
import { ButtonPagination } from "../../utils/ButtonPagination";
import { BaseCommand } from "../../structures/BaseCommand";
import { createEmbed } from "../../utils/createEmbed";
import { IQueueSong } from "../../typings";
import { chunk } from "../../utils/chunk";
import i18n from "../../config";
import { AudioPlayerState, AudioResource } from "@discordjs/voice";
import { Util } from "discord.js";

export class RemoveCommand extends BaseCommand {
    public constructor(client: BaseCommand["client"]) {
        super(client, {
            description: i18n.__("commands.music.remove.description"),
            name: "remove",
            slash: {
                options: [
                    {
                        description: i18n.__("commands.music.remove.slashPositionsDescription"),
                        name: "positions",
                        required: true,
                        type: "STRING"
                    }
                ]
            },
            usage: i18n.__("commands.music.remove.usage")
        });
    }

    public async execute(ctx: CommandContext): Promise<void> {
        if (!inVC(ctx)) return;
        if (!haveQueue(ctx)) return;
        if (!sameVC(ctx)) return;

        const djRole = await this.client.utils.fetchDJRole(ctx.guild!);
        if (!ctx.member?.roles.cache.has(djRole.id) && !ctx.member?.permissions.has("MANAGE_GUILD")) {
            void ctx.reply({ embeds: [createEmbed("error", i18n.__("commands.music.remove.noPermission"), true)] });
            return;
        }

        const positions = (ctx.options?.getString("positions") ?? ctx.args.join(" ")).split(/[, ]/).filter(Boolean);
        if (!positions.length) {
            void ctx.reply({ embeds: [createEmbed("error", i18n.__("commands.music.remove.noPositions"), true)] });
            return;
        }

        const cloned = [...ctx.guild!.queue!.songs.sortByIndex().values()];
        const songs = positions.map(x => cloned[parseInt(x) - 1]).filter(Boolean);
        for (const song of songs) {
            ctx.guild!.queue!.songs.delete(song.key);
        }

        const np = (ctx.guild?.queue?.player?.state as (AudioPlayerState & { resource: AudioResource|undefined })|undefined)?.resource?.metadata as IQueueSong|undefined;
        const isSkip = songs.map(x => x.key).includes(np?.key as string);
        if (isSkip) {
            this.client.commands.get("skip")?.execute(ctx);
        }

        const opening = `${i18n.__mf("commands.music.remove.songsRemoved", { removed: songs.length })}${isSkip ? i18n.__("commands.music.remove.songSkip") : ""}`;
        const pages = await Promise.all(chunk(songs, 10).map(async (v, i) => {
            const texts = await Promise.all(v.map((song, index) => `${(i * 10) + (index + 1)}.) ${Util.escapeMarkdown(parseHTMLElements(song.song.title))}`));

            return texts.join("\n");
        }));
        const getText = (page: string): string => `\`\`\`\n${opening}\n\n${page}\`\`\``;
        const embed = createEmbed("info", getText(pages[0])).setFooter({ text: `• ${i18n.__mf("reusable.pageFooter", { actual: 1, total: pages.length })}` });
        const msg = await ctx.reply({ embeds: [embed] }).catch(() => undefined);

        if (!msg) return;
        void new ButtonPagination(msg, {
            author: ctx.author.id,
            edit: (i, e, p) => {
                e.setDescription(getText(p)).setFooter({ text: `• ${i18n.__mf("reusable.pageFooter", { actual: i + 1, total: pages.length })}` });
            },
            embed,
            pages
        }).start();
    }
}
