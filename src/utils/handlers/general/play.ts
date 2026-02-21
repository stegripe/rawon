import { type Buffer } from "node:buffer";
import fs, { promises as fsp } from "node:fs";
import os from "node:os";
import nodePath from "node:path";
import { clearTimeout, setTimeout } from "node:timers";
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
import { getEffectivePrefix } from "../../functions/getEffectivePrefix.js";
import { i18n__, i18n__mf } from "../../functions/i18n.js";
import { type FfmpegStreamWithEvents, isErrnoException } from "../../typeGuards.js";
import {
    AgeRestrictedError,
    AllCookiesFailedError,
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
        (nextSong?.length ?? 0) > 0 ? queue.songs.get(nextSong as string) : queue.songs.first();

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
                            usage: `**\`${getEffectivePrefix(queue.client, guild.id)}play\`**`,
                        })}`,
                    ),
                ],
            });
            queue.queueEndedNotified = true;
        }

        void queue.client.requestChannelManager.updatePlayerMessage(guild);

        setTimeout(async () => {
            if (!guild.queue?.songs.first()) {
                await queue.destroy();
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
    let ffmpegStderr = "";

    try {
        const streamResult = await getStream(
            queue.client,
            song.song.url,
            song.song.isLive,
            seekSeconds,
        );

        queue.client.logger.debug(
            `[PLAY_HANDLER] streamResult for ${song.song.title}: cachePath=${Boolean(
                streamResult.cachePath,
            )}, hasStream=${Boolean(streamResult.stream)}`,
        );

        if (streamResult.cachePath) {
            const args = ffmpegArgs(queue.filters, seekSeconds, streamResult.cachePath);
            queue.client.logger.debug("[PLAY_HANDLER][FFMPEG_ARGS]", args.join(" "));
            ffmpegStream = new prism.FFmpeg({
                args,
            });
            (ffmpegStream as FfmpegStreamWithEvents).stderr?.on?.("data", (chunk: Buffer) => {
                const s = chunk.toString();
                ffmpegStderr += s;
                queue.client.logger.debug("[PLAY_HANDLER][FFMPEG_STERR]", s);
            });
            (ffmpegStream as FfmpegStreamWithEvents).on?.("error", (e: unknown) =>
                queue.client.logger.error("[PLAY_HANDLER][FFMPEG_ERROR]", e),
            );
            (ffmpegStream as FfmpegStreamWithEvents).on?.("close", (code?: unknown) =>
                queue.client.logger.debug("[PLAY_HANDLER][FFMPEG_CLOSE]", code),
            );
        } else if (streamResult.stream) {
            if (seekSeconds === 0) {
                const args = ffmpegArgs(queue.filters, 0);
                queue.client.logger.debug("[PLAY_HANDLER][FFMPEG_ARGS_STREAM]", args.join(" "));
                ffmpegStream = new prism.FFmpeg({ args });

                (ffmpegStream as FfmpegStreamWithEvents).stderr?.on?.("data", (chunk: Buffer) => {
                    const s = chunk.toString();
                    ffmpegStderr += s;
                    queue.client.logger.debug("[PLAY_HANDLER][FFMPEG_STERR]", s);
                });

                (ffmpegStream as FfmpegStreamWithEvents).on?.("error", (e: unknown) => {
                    queue.client.logger.error("[PLAY_HANDLER][FFMPEG_ERROR]", e);
                    const errStr = String(e ?? "");
                    const isPremature =
                        errStr.includes("Premature close") ||
                        (isErrnoException(e) && e.code === "ERR_STREAM_PREMATURE_CLOSE");
                    if (isPremature) {
                        queue.client.logger.debug(
                            "[PLAY_HANDLER] Ignoring premature-close ffmpeg error",
                            e,
                        );
                        return;
                    }
                    try {
                        queue.player.emit(
                            "error",
                            new AudioPlayerError(
                                e as Error,
                                undefined as unknown as import("@discordjs/voice").AudioResource,
                            ),
                        );
                    } catch (_) {}
                });

                try {
                    streamResult.stream.pipe(ffmpegStream);
                } catch (e) {
                    queue.client.logger.error(
                        "[PLAY_HANDLER] Failed to pipe stream into ffmpeg:",
                        e,
                    );
                    throw e;
                }
            } else {
                const tmpFile = nodePath.join(
                    os.tmpdir(),
                    `rawon-direct-${Date.now()}-${Math.random().toString(36).slice(2)}.tmp`,
                );

                queue.client.logger.debug(
                    "[PLAY_HANDLER] Writing incoming stream to temp file",
                    tmpFile,
                );

                const writeStream = fs.createWriteStream(tmpFile);
                const DOWNLOAD_TIMEOUT_MS = 60_000;
                let downloadTimeout: NodeJS.Timeout | null = null;

                const streamPromise = new Promise<void>((resolve, reject) => {
                    const onError = (e: unknown) => {
                        if (downloadTimeout) {
                            clearTimeout(downloadTimeout);
                            downloadTimeout = null;
                        }
                        try {
                            writeStream.destroy();
                        } catch {}
                        reject(e);
                    };

                    downloadTimeout = setTimeout(() => {
                        onError(new Error("Temp download timeout"));
                    }, DOWNLOAD_TIMEOUT_MS);

                    streamResult.stream?.on?.("error", onError);
                    writeStream.on("error", onError);
                    writeStream.on("finish", () => {
                        if (downloadTimeout) {
                            clearTimeout(downloadTimeout);
                            downloadTimeout = null;
                        }
                        resolve();
                    });

                    streamResult.stream?.pipe(writeStream);
                });

                try {
                    await streamPromise;
                } catch (e) {
                    queue.client.logger.error(
                        "[PLAY_HANDLER] Failed to write stream to temp file:",
                        e,
                    );
                    throw e;
                }

                const args = ffmpegArgs(queue.filters, seekSeconds, tmpFile);
                queue.client.logger.debug("[PLAY_HANDLER][FFMPEG_ARGS]", args.join(" "));
                ffmpegStream = new prism.FFmpeg({ args });

                (ffmpegStream as FfmpegStreamWithEvents).stderr?.on?.("data", (chunk: Buffer) => {
                    const s = chunk.toString();
                    ffmpegStderr += s;
                    queue.client.logger.debug("[PLAY_HANDLER][FFMPEG_STERR]", s);
                });
                (ffmpegStream as FfmpegStreamWithEvents).on?.("error", (e: unknown) => {
                    queue.client.logger.error("[PLAY_HANDLER][FFMPEG_ERROR]", e);
                    const errStr = String(e ?? "");
                    const isPremature =
                        errStr.includes("Premature close") ||
                        (isErrnoException(e) && e.code === "ERR_STREAM_PREMATURE_CLOSE");
                    if (isPremature) {
                        queue.client.logger.debug(
                            "[PLAY_HANDLER] Ignoring premature-close ffmpeg error",
                            e,
                        );
                        return;
                    }
                    try {
                        queue.player.emit(
                            "error",
                            new AudioPlayerError(
                                e as Error,
                                undefined as unknown as import("@discordjs/voice").AudioResource,
                            ),
                        );
                    } catch (_) {}
                });
                (ffmpegStream as FfmpegStreamWithEvents).on?.("close", async (code?: unknown) => {
                    queue.client.logger.debug("[PLAY_HANDLER][FFMPEG_CLOSE]", code);
                    try {
                        await fsp.unlink(tmpFile).catch(() => null);
                        queue.client.logger.debug("[PLAY_HANDLER] Temp file deleted", tmpFile);
                    } catch {}
                });
            }
        } else {
            throw new Error("No stream or cache path available");
        }
    } catch (error) {
        try {
            queue.client.logger.debug("[PLAY_HANDLER][DIAGNOSTIC] resource metadata:", {
                url: song.song.url,
                title: song.song.title,
                isLive: song.song.isLive,
            });
        } catch {}
        queue.endSkip();
        const isRequestChannel = queue.client.requestChannelManager.isRequestChannel(
            guild,
            queue.textChannel.id,
        );

        if (error instanceof AllCookiesFailedError) {
            queue.client.logger.error(
                `[PLAY_HANDLER] ❌ Bot detection for guild ${guild.name}(${guild.id}), stopping queue`,
            );

            if (!isRequestChannel) {
                await queue.textChannel.send({
                    embeds: [
                        createEmbed(
                            "error",
                            __mf("utils.generalHandler.allCookiesFailed", {
                                prefix: getEffectivePrefix(queue.client, guild.id),
                            }),
                            true,
                        ),
                    ],
                });
            }

            await queue.destroy();
            return;
        }

        if (shouldRequeueOnError(error as Error)) {
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
                                song: `**[${song.song.title}](${song.song.url})**`,
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

        if (error instanceof AgeRestrictedError) {
            queue.client.logger.warn(
                `[PLAY_HANDLER] ⚠️ Age restricted content detected for "${song.song.title}": ${(error as Error).message}`,
            );

            if (!isRequestChannel) {
                await queue.textChannel.send({
                    embeds: [
                        createEmbed(
                            "error",
                            `${__mf("utils.generalHandler.ageRestricted", {
                                song: `**[${song.song.title}](${song.song.url})**`,
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

        queue.client.logger.error(
            `[PLAY_HANDLER] ❌ Unrecoverable error playing song "${song.song.title}": ${(error as Error).message}`,
        );

        if (!isRequestChannel) {
            await queue.textChannel.send({
                embeds: [
                    createEmbed(
                        "error",
                        `${__mf("utils.generalHandler.errorPlaying", {
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

    let resource: import("@discordjs/voice").AudioResource<unknown> | undefined;
    try {
        queue.client.logger.debug(
            "[PLAY_HANDLER] Creating audio resource with inputType=Arbitrary",
        );
        resource = createAudioResource(ffmpegStream, {
            inlineVolume: true,
            inputType: StreamType.Arbitrary,
            metadata: song,
        });

        if (!resource) {
            queue.client.logger.error("[PLAY_HANDLER] Resource creation returned undefined");
            return;
        }

        resource.volume?.setVolumeLogarithmic(queue.volume / 100);

        resource.playStream.on("error", (e: unknown) => {
            const errStr = String(e ?? "");
            const isPremature =
                errStr.includes("Premature close") ||
                (isErrnoException(e) && e.code === "ERR_STREAM_PREMATURE_CLOSE");
            if (isPremature) {
                queue.client.logger.debug(
                    "[PLAY_HANDLER] Ignoring premature-close resource stream error",
                );
                return;
            }
            queue.client.logger.error("[PLAY_HANDLER][RESOURCE_STREAM_ERROR]", e);
        });
    } catch (err) {
        queue.client.logger.error(
            "[PLAY_HANDLER][RESOURCE_CREATE_ERROR]",
            err instanceof Error ? (err.stack ?? err.message) : err,
        );
        queue.client.logger.debug(
            "[PLAY_HANDLER][RESOURCE_DIAGNOSTIC] ffmpegStderr:",
            ffmpegStderr.substring(0, 10_000),
        );
        queue.client.logger.debug("[PLAY_HANDLER][RESOURCE_DIAGNOSTIC] song metadata:", {
            title: song.song.title,
            url: song.song.url,
            isLive: song.song.isLive,
        });
        try {
            queue.player.emit(
                "error",
                new AudioPlayerError(
                    err instanceof Error ? err : new Error(String(err)),
                    undefined as unknown as import("@discordjs/voice").AudioResource,
                ),
            );
        } catch (_) {}
        return;
    }

    queue.client.debugLog.logData(
        "info",
        "PLAY_HANDLER",
        `Created audio resource for ${guild.name}(${guild.id})`,
    );
    try {
        queue.client.logger.debug("[PLAY_HANDLER][RESOURCE_CREATED]", {
            title: song.song.title,
            url: song.song.url,
            isLive: song.song.isLive,
            metadata: resource?.metadata ?? null,
        });
    } catch {}

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
                queue?.player.emit(
                    "error",
                    new AudioPlayerError(
                        suppressed.error as Error,
                        resource ??
                            (undefined as unknown as import("@discordjs/voice").AudioResource),
                    ),
                );
                return;
            }
        }

        queue?.player.play(resource!);
    }

    if (wasIdle === true) {
        void playResource();
    } else {
        queue.client.debugLog.logData(
            "info",
            "PLAY_HANDLER",
            `Trying to enter Ready state in guild ${guild.name}(${guild.id}) voice connection`,
        );
        await entersState(queue.connection!, VoiceConnectionStatus.Ready, 15_000)
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
                queue.player.emit(
                    "error",
                    new AudioPlayerError(
                        error as Error,
                        resource ??
                            (undefined as unknown as import("@discordjs/voice").AudioResource),
                    ),
                );
            });
    }
}
