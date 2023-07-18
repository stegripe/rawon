import { createEmbed } from "../../functions/createEmbed.js";
import { ffmpegArgs } from "../../functions/ffmpegArgs.js";
import i18n from "../../../config/index.js";
import { getStream } from "../YTDLUtil.js";
import { AudioPlayerError, createAudioResource, entersState, StreamType, VoiceConnectionStatus } from "@discordjs/voice";
import { ChannelType, Guild } from "discord.js";
import prism from "prism-media";

export async function play(guild: Guild, nextSong?: string, wasIdle?: boolean): Promise<void> {
    const queue = guild.queue;
    if (!queue) return;

    const song = nextSong ? queue.songs.get(nextSong) : queue.songs.first();

    clearTimeout(queue.dcTimeout!);
    if (!song) {
        queue.lastMusicMsg = null;
        queue.lastVSUpdateMsg = null;
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
        queue.dcTimeout = queue.stayInVC
            ? null
            : setTimeout(() => {
                queue.destroy();
                void queue.textChannel
                    .send({ embeds: [createEmbed("info", `👋 **|** ${i18n.__("utils.generalHandler.leftVC")}`)] })
                    .then(msg => {
                        setTimeout(() => {
                            void msg.delete();
                        }, 3500);
                    });
            }, 60000);
        queue.client.debugLog.logData("info", "PLAY_HANDLER", `Queue ended for ${guild.name}(${guild.id})`);
        return;
    }

    const stream = new prism.FFmpeg({
        args: ffmpegArgs(queue.filters)
    });
    (await getStream(queue.client, song.song.url)).pipe(stream);

    const resource = createAudioResource(stream, { inlineVolume: true, inputType: StreamType.OggOpus, metadata: song });

    queue.client.debugLog.logData("info", "PLAY_HANDLER", `Created audio resource for ${guild.name}(${guild.id})`);

    queue.connection?.subscribe(queue.player);

    async function playResource(): Promise<void> {
        if (guild.channels.cache.get(queue!.connection!.joinConfig.channelId!)?.type === ChannelType.GuildStageVoice) {
            queue?.client.debugLog.logData(
                "info",
                "PLAY_HANDLER",
                `Trying to be a speaker in ${guild.members.me?.voice.channel?.name ?? "Unknown"}(${guild.members.me?.voice.channel?.id ?? "ID UNKNOWN"
                }) in guild ${guild.name}(${guild.id})`
            );
            const suppressed = await guild.members.me?.voice
                .setSuppressed(false)
                .catch((err: Error) => ({ error: err }));
            if (suppressed && "error" in suppressed) {
                queue?.client.debugLog.logData(
                    "error",
                    "PLAY_HANDLER",
                    `Failed to be a speaker in ${guild.members.me?.voice.channel?.name ?? "Unknown"}(${guild.members.me?.voice.channel?.id ?? "ID UNKNOWN"
                    }) in guild ${guild.name}(${guild.id}). Reason: ${suppressed.error.message}`
                );
                queue?.player.emit("error", new AudioPlayerError(suppressed.error, resource));
                return;
            }
        }

        queue?.player.play(resource);
    }

    if (wasIdle) {
        void playResource();
    } else {
        queue.client.debugLog.logData(
            "info",
            "PLAY_HANDLER",
            `Trying to enter Ready state in guild ${guild.name}(${guild.id}) voice connection`
        );
        entersState(queue.connection!, VoiceConnectionStatus.Ready, 15000)
            .then(async () => {
                await playResource();
            })
            .catch((err: Error) => {
                if (err.message === "The operation was aborted.")
                    err.message = "Cannot establish a voice connection within 15 seconds.";
                queue.client.debugLog.logData(
                    "error",
                    "PLAY_HANDLER",
                    `Failed to enter Ready state in guild ${guild.name}(${guild.id}) voice connection. Reason: ${err.message}`
                );
                queue.player.emit("error", new AudioPlayerError(err, resource));
            });
    }
}
