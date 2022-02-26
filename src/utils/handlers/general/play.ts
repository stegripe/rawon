import { createEmbed } from "../../functions/createEmbed";
import { Rawon } from "../../../structures/Rawon";
import { QueueSong } from "../../../typings";
import { getStream } from "../YTDLUtil";
import i18n from "../../../config";
import { AudioPlayerError, AudioPlayerPlayingState, AudioPlayerStatus, createAudioPlayer, createAudioResource, entersState, VoiceConnectionStatus } from "@discordjs/voice";
import { Guild } from "discord.js";

export async function play(client: Rawon, guild: Guild, nextSong?: string, wasIdle?: boolean): Promise<void> {
    const queue = guild.queue;
    if (!queue) return;
    if (queue.player === null) queue.player = createAudioPlayer();

    const song = nextSong ? queue.songs.get(nextSong) : queue.songs.first();

    clearTimeout(queue.dcTimeout!);
    if (!song) {
        queue.lastMusicMsg = null;
        queue.lastVSUpdateMsg = null;
        void queue.textChannel.send({ embeds: [createEmbed("info", `⏹ **|** ${i18n.__mf("utils.generalHandler.queueEnded", { usage: `\`${guild.client.config.mainPrefix}play\`` })}`)] });
        queue.dcTimeout = queue.stayInVC
            ? null
            : setTimeout(() => {
                queue.destroy();
                void queue.textChannel.send({ embeds: [createEmbed("info", `👋 **|** ${i18n.__("utils.generalHandler.leftVC")}`)] })
                    .then(msg => {
                        setTimeout(() => {
                            void msg.delete();
                        }, 3500);
                    });
            }, 60000);
        return;
    }

    const resource = createAudioResource(await getStream(song.song.url), { inlineVolume: true, metadata: song });

    queue.connection?.subscribe(queue.player);

    async function playResource(): Promise<void> {
        if (guild.channels.cache.get(queue!.connection!.joinConfig.channelId!)?.type === "GUILD_STAGE_VOICE") {
            const suppressed = await guild.me?.voice.setSuppressed(false).catch(err => ({ error: err }));
            if (suppressed && "error" in suppressed) {
                queue?.player?.emit("error", new AudioPlayerError(suppressed.error as Error, resource));
                return;
            }
        }

        queue?.player?.play(resource);
    }

    const sendStartPlayingMsg = (newSong: QueueSong["song"]): void => {
        client.logger.info(`${client.shard ? `[Shard #${client.shard.ids[0]}]` : ""} Track: "${newSong.title}" on ${guild.name} has started.`);
        queue.textChannel.send({ embeds: [createEmbed("info", `▶ **|** ${i18n.__mf("utils.generalHandler.startPlaying", { song: `[${newSong.title}](${newSong.url})` })}`).setThumbnail(newSong.thumbnail)] })
            .then(m => queue.lastMusicMsg = m.id)
            .catch(e => client.logger.error("PLAY_ERR:", e));
    };

    if (wasIdle) {
        void playResource();
    } else {
        // eslint-disable-next-line max-lines
        entersState(queue.connection!, VoiceConnectionStatus.Ready, 15000)
            .then(async () => {
                await playResource();
            })
            .catch((err: Error) => {
                if (err.message === "The operation was aborted") err.message = "Cannot establish a voice connection within 15 seconds.";
                queue.player?.emit("error", new AudioPlayerError(err, resource));
            });
    }

    queue.player.removeAllListeners();

    queue.player.on("stateChange", (oldState, newState) => {
        if (newState.status === AudioPlayerStatus.Playing && oldState.status !== AudioPlayerStatus.Paused) {
            const newSong = ((queue.player!.state as AudioPlayerPlayingState).resource.metadata as QueueSong).song;
            sendStartPlayingMsg(newSong);
        } else if (newState.status === AudioPlayerStatus.Idle) {
            client.logger.info(`${client.shard ? `[Shard #${client.shard.ids[0]}]` : ""} Track: "${song.song.title}" on ${guild.name} has ended.`);
            queue.skipVoters = [];
            if (queue.loopMode === "OFF") {
                queue.songs.delete(song.key);
            }

            // eslint-disable-next-line no-nested-ternary
            const nextS = queue.shuffle && queue.loopMode !== "SONG" ? queue.songs.random()?.key : queue.loopMode === "SONG" ? song.key : queue.songs.sortByIndex().filter(x => x.index > song.index).first()?.key ?? (queue.loopMode === "QUEUE" ? queue.songs.sortByIndex().first()?.key ?? "" : "");

            queue.textChannel.send({ embeds: [createEmbed("info", `⏹ **|** ${i18n.__mf("utils.generalHandler.stopPlaying", { song: `[${song.song.title}](${song.song.url})` })}`).setThumbnail(song.song.thumbnail)] })
                .then(m => queue.lastMusicMsg = m.id)
                .catch(e => client.logger.error("PLAY_ERR:", e))
                .finally(() => {
                    queue.player = null;
                    play(client, guild, nextS).catch(e => {
                        queue.textChannel.send({ embeds: [createEmbed("error", i18n.__mf("utils.generalHandler.errorPlaying", { message: `\`${e as string}\`` }), true)] })
                            .catch(er => client.logger.error("PLAY_ERR:", er));
                        queue.connection?.disconnect();
                        return client.logger.error("PLAY_ERR:", e);
                    });
                });
        }
    })
        .on("error", err => {
            queue.textChannel.send({ embeds: [createEmbed("error", i18n.__mf("utils.generalHandler.errorPlaying", { message: `\`${err.message}\`` }), true)] }).catch(e => client.logger.error("PLAY_CMD_ERR:", e));
            queue.destroy();
            client.logger.error("PLAY_ERR:", err);
        })
        .on("debug", message => {
            client.logger.debug(message);
        });
}
