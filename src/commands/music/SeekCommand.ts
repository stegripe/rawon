import { type AudioPlayerPlayingState, AudioPlayerStatus } from "@discordjs/voice";
import { ApplicationCommandOptionType } from "discord.js";
import { enableAudioCache } from "../../config/env.js";
import i18n from "../../config/index.js";
import { BaseCommand } from "../../structures/BaseCommand.js";
import { type CommandContext } from "../../structures/CommandContext.js";
import { type QueueSong } from "../../typings/index.js";
import { Command } from "../../utils/decorators/Command.js";
import { haveQueue, inVC, sameVC } from "../../utils/decorators/MusicUtil.js";
import { createEmbed } from "../../utils/functions/createEmbed.js";
import { i18n__, i18n__mf } from "../../utils/functions/i18n.js";
import { normalizeTime } from "../../utils/functions/normalizeTime.js";
import { parseTime } from "../../utils/functions/parseTime.js";
import { checkQuery, play } from "../../utils/handlers/GeneralUtil.js";

@Command({
    aliases: ["sk"],
    description: i18n.__("commands.music.seek.description"),
    name: "seek",
    slash: {
        options: [
            {
                description: i18n.__("commands.music.seek.slashTimeDescription"),
                name: "time",
                type: ApplicationCommandOptionType.String,
                required: true,
            },
        ],
    },
    usage: i18n.__("commands.music.seek.usage"),
})
export class SeekCommand extends BaseCommand {
    @inVC
    @haveQueue
    @sameVC
    public async execute(ctx: CommandContext): Promise<void> {
        const __ = i18n__(this.client, ctx.guild);
        const __mf = i18n__mf(this.client, ctx.guild);

        const queue = ctx.guild?.queue;
        if (!queue) {
            return;
        }

        if (queue.player.state.status !== AudioPlayerStatus.Playing) {
            await ctx.reply({
                embeds: [createEmbed("warn", __("commands.music.seek.noPlaying"))],
            });
            return;
        }

        const song = (queue.player.state as AudioPlayerPlayingState).resource.metadata as QueueSong;

        if (song.song.isLive) {
            await ctx.reply({
                embeds: [createEmbed("error", __("commands.music.seek.cantSeekLive"), true)],
            });
            return;
        }

        const queryCheck = checkQuery(song.song.url);
        if (queryCheck.sourceType === "soundcloud") {
            await ctx.reply({
                embeds: [createEmbed("error", __("commands.music.seek.cantSeekSoundcloud"), true)],
            });
            return;
        }

        const timeArg = ctx.args[0] ?? ctx.options?.getString("time");
        if (!timeArg) {
            await ctx.reply({
                embeds: [createEmbed("error", __("commands.music.seek.noTime"), true)],
            });
            return;
        }

        const seekSeconds = parseTime(timeArg);
        if (seekSeconds === null || seekSeconds < 0) {
            await ctx.reply({
                embeds: [
                    createEmbed(
                        "error",
                        __mf("commands.music.seek.invalidTime", { time: `**\`${timeArg}\`**` }),
                        true,
                    ),
                ],
            });
            return;
        }

        if (seekSeconds >= song.song.duration) {
            await ctx.reply({
                embeds: [
                    createEmbed(
                        "error",
                        __mf("commands.music.seek.exceedsDuration", {
                            duration: `**\`${normalizeTime(song.song.duration)}\`**`,
                        }),
                        true,
                    ),
                ],
            });
            return;
        }

        // Check if cache is available when seeking with caching enabled
        if (enableAudioCache && seekSeconds > 0) {
            const isCached = this.client.audioCache.isCached(song.song.url);
            const isInProgress = this.client.audioCache.isInProgress(song.song.url);

            if (!isCached && isInProgress) {
                // Cache is being built, tell user to wait
                await ctx.reply({
                    embeds: [createEmbed("warn", __("commands.music.seek.waitingForCache"))],
                });
                return;
            }

            if (!isCached && !isInProgress) {
                // Cache not available and not being built
                await ctx.reply({
                    embeds: [createEmbed("error", __("commands.music.seek.notCached"), true)],
                });
                return;
            }
        }

        await ctx.reply({
            embeds: [
                createEmbed(
                    "success",
                    `⏩ **|** ${__mf("commands.music.seek.seeked", {
                        time: `**\`${normalizeTime(seekSeconds)}\`**`,
                    })}`,
                ),
            ],
        });

        queue.playing = false;
        void play(ctx.guild!, song.key, true, seekSeconds);
    }
}
