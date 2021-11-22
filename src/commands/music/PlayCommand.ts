import { checkQuery, handleVideos, searchTrack } from "../../utils/handlers/GeneralUtil";
import { inVC, sameVC, validVC } from "../../utils/decorators/MusicUtil";
import { CommandContext } from "../../structures/CommandContext";
import { BaseCommand } from "../../structures/BaseCommand";
import { createEmbed } from "../../utils/createEmbed";
import { ISong } from "../../typings";
import i18n from "../../config";
import { Message } from "discord.js";

export class PlayCommand extends BaseCommand {
    public constructor(client: BaseCommand["client"]) {
        super(client, {
            aliases: ["p", "add"],
            description: i18n.__("commands.music.play.description"),
            name: "play",
            slash: {
                description: i18n.__("commands.music.play.description"),
                options: [
                    {
                        description: i18n.__("commands.music.play.slashQueryDescription"),
                        name: "query",
                        type: "STRING",
                        required: true
                    }
                ]
            },
            usage: i18n.__("commands.music.play.usage")
        });
    }

    public async execute(ctx: CommandContext): Promise<Message|void> {
        if (!inVC(ctx)) return;
        if (!validVC(ctx)) return;
        if (!sameVC(ctx)) return;
        if (ctx.isInteraction() && !ctx.deferred) await ctx.deferReply();

        const voiceChannel = ctx.member!.voice.channel!;
        if (ctx.additionalArgs.get("fromSearch")) {
            const tracks = ctx.additionalArgs.get("values");
            const toQueue: ISong[] = [];
            for (const track of tracks) {
                const song = await searchTrack(this.client, track as string).catch(() => null);
                if (!song) continue;
                toQueue.push(song.items[0]);
            }
            return handleVideos(this.client, ctx, toQueue, voiceChannel);
        }
        const query = (ctx.args.join(" ") || ctx.options?.getString("query")) ?? (ctx.additionalArgs.get("values") ? ctx.additionalArgs.get("values")[0] : undefined) as string | undefined;

        if (!query) {
            return ctx.reply({
                embeds: [createEmbed("warn", i18n.__mf("reusable.invalidUsage", { prefix: `${this.client.config.mainPrefix}help`, name: `${this.meta.name}` }))]
            });
        }

        const url = query.replace(/<(.+)>/g, "$1");

        if (ctx.guild?.queue && voiceChannel.id !== ctx.guild.queue.connection?.joinConfig.channelId) {
            return ctx.reply({ embeds: [createEmbed("warn", i18n.__mf("commands.music.play.alreadyPlaying", { voiceChannel: ctx.guild.channels.cache.get(ctx.guild.queue.connection?.joinConfig.channelId as string)?.name ?? "#unknown-channel" }))] });
        }

        const queryCheck = checkQuery(url);
        const songs = await searchTrack(this.client, url).catch(() => undefined);
        if (!songs || (songs.items.length <= 0)) return ctx.reply({ embeds: [createEmbed("error", i18n.__("commands.music.play.noSongData"), true)] });

        return handleVideos(this.client, ctx, queryCheck.type === "playlist" ? songs.items : [songs.items[0]], voiceChannel);
    }
}
