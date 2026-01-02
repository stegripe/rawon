import { ApplicationCommandOptionType, type Message, type VoiceBasedChannel } from "discord.js";
import i18n from "../../config/index.js";
import { BaseCommand } from "../../structures/BaseCommand.js";
import { type CommandContext } from "../../structures/CommandContext.js";
import { Command } from "../../utils/decorators/Command.js";
import { inVC, sameVC, useRequestChannel, validVC } from "../../utils/decorators/MusicUtil.js";
import { createEmbed } from "../../utils/functions/createEmbed.js";
import { i18n__, i18n__mf } from "../../utils/functions/i18n.js";
import { checkQuery, handleVideos, searchTrack } from "../../utils/handlers/GeneralUtil.js";

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
                type: ApplicationCommandOptionType.String,
                required: true,
            },
        ],
    },
    usage: i18n.__("commands.music.play.usage"),
})
export class PlayCommand extends BaseCommand {
    @useRequestChannel
    @inVC
    @validVC
    @sameVC
    public async execute(ctx: CommandContext): Promise<Message | undefined> {
        const __ = i18n__(this.client, ctx.guild);
        const __mf = i18n__mf(this.client, ctx.guild);

        if (ctx.isInteraction() && !ctx.deferred) {
            await ctx.deferReply();
        }

        const voiceChannel = ctx.member?.voice.channel as unknown as VoiceBasedChannel;
        if (ctx.additionalArgs.get("fromSearch") !== undefined) {
            const tracks = ctx.additionalArgs.get("values") as string[];
            const searchResults = await Promise.all(
                tracks.map(async (track) => searchTrack(this.client, track).catch(() => null)),
            );
            const toQueue = searchResults
                .filter((result): result is NonNullable<typeof result> => result !== null)
                .map((result) => result.items[0]);

            return handleVideos(this.client, ctx, toQueue, voiceChannel);
        }

        const query =
            (ctx.args.join(" ") || ctx.options?.getString("query")) ??
            (ctx.additionalArgs.get("values") === undefined
                ? undefined
                : (ctx.additionalArgs.get("values") as (string | undefined)[])[0]);

        if ((query?.length ?? 0) === 0) {
            return ctx.reply({
                embeds: [
                    createEmbed(
                        "warn",
                        __mf("reusable.invalidUsage", {
                            prefix: `**\`${this.client.config.mainPrefix}help\`**`,
                            name: `**\`${this.meta.name}\`**`,
                        }),
                    ),
                ],
            });
        }

        if (
            ctx.guild?.queue &&
            voiceChannel.id !== ctx.guild.queue.connection?.joinConfig.channelId
        ) {
            return ctx.reply({
                embeds: [
                    createEmbed(
                        "warn",
                        __mf("commands.music.play.alreadyPlaying", {
                            voiceChannel: `**\`${
                                ctx.guild.channels.cache.get(
                                    (
                                        ctx.guild.queue.connection?.joinConfig as {
                                            channelId: string;
                                        }
                                    ).channelId,
                                )?.name ?? "#unknown-channel"
                            }\`**`,
                        }),
                    ),
                ],
            });
        }

        const queryCheck = checkQuery(query ?? "");
        const songs = await searchTrack(this.client, query ?? "").catch(() => void 0);

        if (!songs || songs.items.length <= 0) {
            return ctx.reply({
                embeds: [createEmbed("error", __("commands.music.play.noSongData"), true)],
            });
        }

        return handleVideos(
            this.client,
            ctx,
            queryCheck.type === "playlist" ? songs.items : [songs.items[0]],
            voiceChannel,
        );
    }
}
