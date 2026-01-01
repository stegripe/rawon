import type EventEmitter from "node:events";
import { setTimeout } from "node:timers";
import {
    AudioPlayerError,
    createAudioResource,
    entersState,
    StreamType,
    VoiceConnectionStatus,
} from "@discordjs/voice";
import { ChannelType, type Guild } from "discord.js";
import prism from "prism-media";
import { createEmbed } from "../../functions/createEmbed.js";
import { ffmpegArgs } from "../../functions/ffmpegArgs.js";
import { i18n__, i18n__mf } from "../../functions/i18n.js";
import {
    AllCookiesFailedError,
    CookieRotationNeededError,
    getStream,
    shouldRequeueOnError,
} from "../YTDLUtil.js";

export async function play(
    guild: Guild,
    nextSong?: string,
    wasIdle?: boolean,
    seekSeconds = 0,
): Promise<void> {
    const queue = guild.queue;
    if (!queue) {
        return;
    }

    const __ = i18n__(queue.client, guild);
    const __mf = i18n__mf(queue.client, guild);

    queue.seekOffset = seekSeconds;

    const song =
        (nextSong?.length ?? 0) > 0
            ? queue.songs.get(nextSong as unknown as string)
            : queue.songs.first();

    if (!song) {
        queue.lastMusicMsg = null;
        queue.lastVSUpdateMsg = null;

        const isRequestChannel = queue.client.requestChannelManager.isRequestChannel(
            guild,
            queue.textChannel.id,
        );
        if (!isRequestChannel) {
            void queue.textChannel.send({
                embeds: [
                    createEmbed(
                        "info",
                        `⏹️ **|** ${__mf("utils.generalHandler.queueEnded", {
                            usage: `\`${guild.client.config.mainPrefix}play\``,
                        })}`,
                    ),
                ],
            });
        }

        void queue.client.requestChannelManager.updatePlayerMessage(guild);

        setTimeout(async () => {
            if (!guild.queue?.songs.first()) {
                queue.destroy();
                if (!isRequestChannel) {
                    const msg = await queue.textChannel.send({
                        embeds: [
                            createEmbed("info", `👋 **|** ${__("utils.generalHandler.leftVC")}`),
                        ],
                    });
                    setTimeout(() => {
                        void msg.delete();
                    }, 3_500);
                }
            }
        }, 60_000);
        queue.client.debugLog.logData(
            "info",
            "PLAY_HANDLER",
            `Queue ended for ${guild.name}(${guild.id})`,
        );
        return;
    }

    let ffmpegStream: prism.FFmpeg;

    try {
        const streamResult = await getStream(
            queue.client,
            song.song.url,
            song.song.isLive,
            seekSeconds,
        );

        if (streamResult.cachePath) {
            ffmpegStream = new prism.FFmpeg({
                args: ffmpegArgs(queue.filters, seekSeconds, streamResult.cachePath),
            });
        } else if (streamResult.stream) {
            ffmpegStream = new prism.FFmpeg({
                args: ffmpegArgs(queue.filters, 0),
            });
            streamResult.stream.pipe(ffmpegStream as unknown as NodeJS.WritableStream);
        } else {
            throw new Error("No stream or cache path available");
        }
    } catch (error) {
        queue.endSkip();
        const isRequestChannel = queue.client.requestChannelManager.isRequestChannel(
            guild,
            queue.textChannel.id,
        );

        if (error instanceof AllCookiesFailedError) {
            queue.client.logger.error(
                `[PLAY_HANDLER] ❌ All cookies failed for guild ${guild.name}(${guild.id}), stopping queue`,
            );

            if (!isRequestChannel) {
                await queue.textChannel.send({
                    embeds: [
                        createEmbed(
                            "error",
                            `⚠️ **|** ${__mf("utils.generalHandler.allCookiesFailed", {
                                prefix: guild.client.config.mainPrefix,
                            })}`,
                            true,
                        ),
                    ],
                });
            }

            queue.destroy();
            return;
        }

        if (error instanceof CookieRotationNeededError || shouldRequeueOnError(error as Error)) {
            queue.client.logger.warn(
                `[PLAY_HANDLER] ⚠️ Error playing song "${song.song.title}", re-queuing for retry. Error: ${(error as Error).message}`,
            );

            const currentSongKey = song.key;
            queue.songs.delete(currentSongKey);

            const newKey = queue.songs.addSong(song.song, song.requester);

            if (!isRequestChannel) {
                const errorMsg = await queue.textChannel.send({
                    embeds: [
                        createEmbed(
                            "warn",
                            `🔄 **|** ${__mf("utils.generalHandler.songRequeued", {
                                song: `[${song.song.title}](${song.song.url})`,
                            })}`,
                        ).setThumbnail(song.song.thumbnail),
                    ],
                });
                setTimeout(() => {
                    errorMsg.delete().catch(() => null);
                }, 10_000);
            }

            const nextS =
                queue.shuffle && queue.loopMode !== "SONG"
                    ? queue.songs.filter((s) => s.key !== newKey).random()?.key
                    : queue.loopMode === "SONG"
                      ? newKey
                      : (queue.songs
                            .sortByIndex()
                            .filter((x) => x.key !== newKey)
                            .first()?.key ?? "");

            if (nextS && nextS.length > 0) {
                void play(guild, nextS, wasIdle);
            } else {
                void play(guild, newKey, wasIdle);
            }
            return;
        }

        queue.client.logger.error(
            `[PLAY_HANDLER] ❌ Unrecoverable error playing song "${song.song.title}": ${(error as Error).message}`,
        );

        if (!isRequestChannel) {
            await queue.textChannel.send({
                embeds: [
                    createEmbed(
                        "error",
                        `❌ **|** ${__mf("utils.generalHandler.errorPlaying", {
                            message: `\`${(error as Error).message.substring(0, 200)}\``,
                        })}`,
                        true,
                    ),
                ],
            });
        }

        queue.songs.delete(song.key);
        const nextS =
            queue.shuffle && queue.loopMode !== "SONG"
                ? queue.songs.random()?.key
                : queue.loopMode === "SONG"
                  ? song.key
                  : (queue.songs.sortByIndex().first()?.key ?? "");

        if (nextS && nextS.length > 0) {
            void play(guild, nextS, wasIdle);
        }
        return;
    }

    const resource = createAudioResource(ffmpegStream, {
        inlineVolume: true,
        inputType: StreamType.OggOpus,
        metadata: song,
    });

    resource.volume?.setVolumeLogarithmic(queue.volume / 100);

    queue.client.debugLog.logData(
        "info",
        "PLAY_HANDLER",
        `Created audio resource for ${guild.name}(${guild.id})`,
    );

    queue.connection?.subscribe(queue.player);

    async function playResource(): Promise<void> {
        if (
            guild.channels.cache.get(queue?.connection?.joinConfig.channelId ?? "")?.type ===
            ChannelType.GuildStageVoice
        ) {
            queue?.client.debugLog.logData(
                "info",
                "PLAY_HANDLER",
                `Trying to be a speaker in ${guild.members.me?.voice.channel?.name ?? "Unknown"}(${
                    guild.members.me?.voice.channel?.id ?? "ID UNKNOWN"
                }) in guild ${guild.name}(${guild.id})`,
            );
            const suppressed = await guild.members.me?.voice
                .setSuppressed(false)
                .catch((error: unknown) => ({ error }));
            if (suppressed && "error" in suppressed) {
                queue?.client.debugLog.logData(
                    "error",
                    "PLAY_HANDLER",
                    `Failed to be a speaker in ${guild.members.me?.voice.channel?.name ?? "Unknown"}(${
                        guild.members.me?.voice.channel?.id ?? "ID UNKNOWN"
                    }) in guild ${guild.name}(${guild.id}). Reason: ${(suppressed.error as Error).message}`,
                );
                (queue?.player as unknown as EventEmitter).emit(
                    "error",
                    new AudioPlayerError(suppressed.error as Error, resource),
                );
                return;
            }
        }

        queue?.player.play(resource);
    }

    if (wasIdle === true) {
        void playResource();
    } else {
        queue.client.debugLog.logData(
            "info",
            "PLAY_HANDLER",
            `Trying to enter Ready state in guild ${guild.name}(${guild.id}) voice connection`,
        );
        await entersState(
            queue.connection as unknown as NonNullable<typeof queue.connection>,
            VoiceConnectionStatus.Ready,
            15_000,
        )
            .then(async () => {
                await playResource();
                return 0;
            })
            .catch((error: unknown) => {
                if ((error as Error).message === "The operation was aborted.") {
                    (error as Error).message =
                        "Cannot establish a voice connection within 15 seconds.";
                }
                queue.client.debugLog.logData(
                    "error",
                    "PLAY_HANDLER",
                    `Failed to enter Ready state in guild ${guild.name}(${guild.id}) voice connection. Reason: ${(error as Error).message}`,
                );
                (queue.player as unknown as EventEmitter).emit(
                    "error",
                    new AudioPlayerError(error as Error, resource),
                );
            });
    }
}
