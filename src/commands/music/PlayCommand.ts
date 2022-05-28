import { checkQuery, handleVideos, searchTrack } from "../../utils/handlers/GeneralUtil";
import { inVC, sameVC, validVC } from "../../utils/decorators/MusicUtil";
import { CommandContext } from "../../structures/CommandContext";
import { createEmbed } from "../../utils/functions/createEmbed";
import { BaseCommand } from "../../structures/BaseCommand";
import { Command } from "../../utils/decorators/Command";
import { Song } from "../../typings";
import i18n from "../../config";
import { Message } from "discord.js";

@Command({
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
})
export class PlayCommand extends BaseCommand {
    @inVC
    @validVC
    @sameVC
    public async execute(ctx: CommandContext): Promise<Message | undefined> {
        if (ctx.isInteraction() && !ctx.deferred) await ctx.deferReply();

        const voiceChannel = ctx.member!.voice.channel!;
        if (ctx.additionalArgs.get("fromSearch")) {
            const tracks = ctx.additionalArgs.get("values");
            const toQueue: Song[] = [];

            for (const track of tracks) {
                const song = await searchTrack(this.client, track as string).catch(() => null);
                if (!song) continue;

                toQueue.push(song.items[0]);
            }

            return handleVideos(this.client, ctx, toQueue, voiceChannel);
        }

        const query =
            (ctx.args.join(" ") || ctx.options?.getString("query")) ??
            (ctx.additionalArgs.get("values")
                ? (ctx.additionalArgs.get("values") as (string | undefined)[])[0]
                : undefined);

        if (!query) {
            return ctx.reply({
                embeds: [
                    createEmbed(
                        "warn",
                        i18n.__mf("reusable.invalidUsage", {
                            prefix: `${this.client.config.mainPrefix}help`,
                            name: `${this.meta.name}`
                        })
                    )
                ]
            });
        }

        if (ctx.guild?.queue && voiceChannel.id !== ctx.guild.queue.connection?.joinConfig.channelId) {
            return ctx.reply({
                embeds: [
                    createEmbed(
                        "warn",
                        i18n.__mf("commands.music.play.alreadyPlaying", {
                            voiceChannel:
                                ctx.guild.channels.cache.get(
                                    (ctx.guild.queue.connection?.joinConfig as { channelId: string }).channelId
                                )?.name ?? "#unknown-channel"
                        })
                    )
                ]
            });
        }

        const queryCheck = checkQuery(query);
        const songs = await searchTrack(this.client, query).catch(() => undefined);
        if (!songs || songs.items.length <= 0) {
            return ctx.reply({
                embeds: [createEmbed("error", i18n.__("commands.music.play.noSongData"), true)]
            });
        }

        return handleVideos(
            this.client,
            ctx,
            queryCheck.type === "playlist" ? songs.items : [songs.items[0]],
            voiceChannel
        );
    }
}
