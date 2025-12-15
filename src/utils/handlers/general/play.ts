import type EventEmitter from "node:events";
import { setTimeout } from "node:timers";
import { AudioPlayerError, createAudioResource, entersState, StreamType, VoiceConnectionStatus } from "@discordjs/voice";
import type { Guild } from "discord.js";
import { ChannelType } from "discord.js";
import prism from "prism-media";
import i18n from "../../../config/index.js";
import { createEmbed } from "../../functions/createEmbed.js";
import { ffmpegArgs } from "../../functions/ffmpegArgs.js";
import { getStream } from "../YTDLUtil.js";

export async function play(guild: Guild, nextSong?: string, wasIdle?: boolean): Promise<void> {
    const queue = guild.queue;
    if (!queue) return;

    const song = (nextSong?.length ?? 0) > 0 ? queue.songs.get(nextSong as unknown as string) : queue.songs.first();

    if (!song) {
        queue.lastMusicMsg = null;
        queue.lastVSUpdateMsg = null;
        
        // Don't send "queue ended" message in request channel to avoid spam
        const isRequestChannel = queue.client.requestChannelManager.isRequestChannel(guild, queue.textChannel.id);
        if (!isRequestChannel) {
            void queue.textChannel.send({
                embeds: [
                    createEmbed(
                        "info",
                        `⏹ **|** ${i18n.__mf("utils.generalHandler.queueEnded", {
                            usage: `\`${guild.client.config.mainPrefix}play\``
                        })}`
                    )
                ]
            });
        }
        
        // Update the request channel player embed to show standby state
        void queue.client.requestChannelManager.updatePlayerMessage(guild);
        
        // Always disconnect after 60 seconds of inactivity
        setTimeout(async () => {
            if (!guild.queue?.songs.first()) {
                queue.destroy();
                // Don't send "left VC" message in request channel
                if (!isRequestChannel) {
                    const msg = await queue.textChannel
                        .send({ embeds: [createEmbed("info", `👋 **|** ${i18n.__("utils.generalHandler.leftVC")}`)] });
                    setTimeout(() => {
                        void msg.delete();
                    }, 3_500);
                }
            }
        }, 60_000);
        queue.client.debugLog.logData("info", "PLAY_HANDLER", `Queue ended for ${guild.name}(${guild.id})`);
        return;
    }

    const stream = new prism.FFmpeg({
        args: ffmpegArgs(queue.filters)
    });
    await getStream(queue.client, song.song.url).then(x => x.pipe(stream as unknown as NodeJS.WritableStream));

    const resource = createAudioResource(stream, { inlineVolume: true, inputType: StreamType.OggOpus, metadata: song });
    
    // Set volume immediately to prevent audio burst at the start
    resource.volume?.setVolumeLogarithmic(queue.volume / 100);

    queue.client.debugLog.logData("info", "PLAY_HANDLER", `Created audio resource for ${guild.name}(${guild.id})`);

    queue.connection?.subscribe(queue.player);

    async function playResource(): Promise<void> {
        if (guild.channels.cache.get(queue?.connection?.joinConfig.channelId ?? "")?.type === ChannelType.GuildStageVoice) {
            queue?.client.debugLog.logData(
                "info",
                "PLAY_HANDLER",
                `Trying to be a speaker in ${guild.members.me?.voice.channel?.name ?? "Unknown"}(${guild.members.me?.voice.channel?.id ?? "ID UNKNOWN"
                }) in guild ${guild.name}(${guild.id})`
            );
            const suppressed = await guild.members.me?.voice
                .setSuppressed(false)
                .catch((error: unknown) => ({ error }));
            if (suppressed && "error" in suppressed) {
                queue?.client.debugLog.logData(
                    "error",
                    "PLAY_HANDLER",
                    `Failed to be a speaker in ${guild.members.me?.voice.channel?.name ?? "Unknown"}(${guild.members.me?.voice.channel?.id ?? "ID UNKNOWN"
                    }) in guild ${guild.name}(${guild.id}). Reason: ${(suppressed.error as Error).message}`
                );
                (queue?.player as unknown as EventEmitter).emit("error", new AudioPlayerError(suppressed.error as Error, resource));
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
            `Trying to enter Ready state in guild ${guild.name}(${guild.id}) voice connection`
        );
        await entersState(queue.connection as unknown as NonNullable<typeof queue.connection>, VoiceConnectionStatus.Ready, 15_000)
            .then(async () => {
                await playResource();
                return 0;
            })
            .catch((error: unknown) => {
                if ((error as Error).message === "The operation was aborted.")
                    (error as Error).message = "Cannot establish a voice connection within 15 seconds.";
                queue.client.debugLog.logData(
                    "error",
                    "PLAY_HANDLER",
                    `Failed to enter Ready state in guild ${guild.name}(${guild.id}) voice connection. Reason: ${(error as Error).message}`
                );
                (queue.player as unknown as EventEmitter).emit("error", new AudioPlayerError(error as Error, resource));
            });
    }
}
