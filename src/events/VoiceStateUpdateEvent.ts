import { BaseEvent } from "../structures/BaseEvent";
import { ServerQueue } from "../structures/ServerQueue";
import { IQueueSong } from "../typings";
import { createEmbed } from "../utils/createEmbed";
import { DefineEvent } from "../utils/decorators/DefineEvent";
import { formatMS } from "../utils/formatMS";
import { AudioPlayerPausedState } from "@discordjs/voice";
import { VoiceState, VoiceChannel, StageChannel } from "discord.js";

@DefineEvent("voiceStateUpdate")
export class VoiceStateUpdateEvent extends BaseEvent {
    public execute(oldState: VoiceState, newState: VoiceState): any {
        const queue = newState.guild.queue;
        if (!queue) return;

        const newVC = newState.channel;
        const oldVC = oldState.channel;
        const oldID = oldVC?.id;
        const newID = newVC?.id;
        const queueVC = newState.guild.channels.cache.get(queue.connection!.joinConfig.channelId!)! as VoiceChannel|StageChannel;
        const oldMember = oldState.member;
        const member = newState.member;
        const queueVCMembers = queueVC.members.filter(m => !m.user.bot);
        const newVCMembers = newVC?.members.filter(m => !m.user.bot);
        const botID = this.client.user?.id;

        if (oldMember?.id === botID && oldID === queueVC.id && newID === undefined) {
            queue.player?.stop(true);
            delete newState.guild.queue;
            this.client.logger.info(`${this.client.shard ? `[Shard #${this.client.shard.ids[0]}]` : ""} Disconnected from the voice channel at ${newState.guild.name}, the queue was deleted.`);
            queue.textChannel.send({ embeds: [createEmbed("error", "I was disconnected from the voice channel, the queue has been deleted.")] })
                .catch(e => this.client.logger.error("VOICE_STATE_UPDATE_EVENT_ERR:", e));
        }

        if (newState.mute !== oldState.mute || newState.deaf !== oldState.deaf) return;

        if (member?.id === botID && oldID === queueVC.id && newID !== queueVC.id && newID !== undefined) {
            if (!newVCMembers) return;
            if (newVCMembers.size === 0 && queue.timeout === null) {
                this.timeout(newVCMembers, queue, newState);
            } else if (newVCMembers.size !== 0 && queue.timeout !== null) {
                this.resume(newVCMembers, queue, newState);
            }
        }

        if (oldID === queueVC.id && newID !== queueVC.id && !member?.user.bot && queue.timeout === null) this.timeout(queueVCMembers, queue, newState);

        if (newID === queueVC.id && !member?.user.bot) this.resume(queueVCMembers, queue, newState);
    }

    private timeout(vcMembers: VoiceChannel["members"], queue: ServerQueue, state: VoiceState): void {
        if (vcMembers.size !== 0) return;

        clearTimeout(queue.timeout!);
        state.guild.queue!.timeout = null;
        queue.player?.pause();

        const timeout = 60000;
        const duration = formatMS(timeout);

        queue.lastVSUpdateMsg = null;
        state.guild.queue!.timeout = setTimeout(() => {
            queue.connection?.disconnect();
            delete state.guild.queue;
            void queue.textChannel.send({ embeds: [createEmbed("error", `⏹ **|** **${duration}** have passed and there's no one who joined the voice channel, the queue has deleted.`).setAuthor("Queue Deleted")] });
        }, timeout);
        void queue.textChannel.send({ embeds: [createEmbed("warn", `⏸ **|** Everyone has left from the voice channel. To save resources, the queue has paused. If there's no one who joins the voice channel in the next **\`${duration}\`**, the queue will be deleted.`).setAuthor("Queue Paused")] })
            .then(msg => queue.lastVSUpdateMsg = msg.id);
    }

    private resume(vcMembers: VoiceChannel["members"], queue: ServerQueue, state: VoiceState): any {
        if (vcMembers.size <= 0) return;

        clearTimeout(queue.timeout!);
        state.guild.queue!.timeout = null;

        const song = ((queue.player!.state as AudioPlayerPausedState).resource.metadata as IQueueSong).song;

        void queue.textChannel.send({ embeds: [createEmbed("info", `▶ **|** Someone has joined the voice channel.\nNow Playing: **[${song.title}](${song.url})**`).setThumbnail(song.thumbnail).setAuthor("Queue Resumed")] }).then(msg => queue.lastVSUpdateMsg = msg.id);
        state.guild.queue?.player?.unpause();
    }
}
