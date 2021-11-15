import { ServerQueue } from "../structures/ServerQueue";
import { BaseEvent } from "../structures/BaseEvent";
import { createEmbed } from "../utils/createEmbed";
import { formatMS } from "../utils/formatMS";
import { IQueueSong } from "../typings";
import i18n from "../config";
import { AudioPlayerPausedState, entersState, VoiceConnectionStatus } from "@discordjs/voice";
import { Message, StageChannel, VoiceState, VoiceChannel } from "discord.js";

export class VoiceStateUpdateEvent extends BaseEvent {
    public constructor(client: BaseEvent["client"]) {
        super(client, "voiceStateUpdate");
    }

    public async execute(oldState: VoiceState, newState: VoiceState): Promise<Message|void> {
        const queue = newState.guild.queue;
        if (!queue) return;

        const newVC = newState.channel;
        const oldVC = oldState.channel;
        const newID = newVC?.id;
        const oldID = oldVC?.id;
        const queueVC = newState.guild.channels.cache.get(queue.connection!.joinConfig.channelId!)! as VoiceChannel | StageChannel;
        const member = newState.member;
        const oldMember = oldState.member;
        const newVCMembers = newVC?.members.filter(m => !m.user.bot);
        const queueVCMembers = queueVC.members.filter(m => !m.user.bot);
        const botID = this.client.user?.id;

        if (oldMember?.id === botID && oldID === queueVC.id && newID === undefined) {
            const isIdle = queue.idle;

            queue.destroy();
            if (!isIdle) {
                this.client.logger.info(`${this.client.shard ? `[Shard #${this.client.shard.ids[0]}]` : ""} Disconnected from the voice channel at ${newState.guild.name}, the queue was deleted.`);
                queue.textChannel.send({ embeds: [createEmbed("error", `⏹️ **|** ${i18n.__("events.voiceStateUpdate.disconnectFromVCMessage")}`)] })
                    .catch(e => this.client.logger.error("VOICE_STATE_UPDATE_EVENT_ERR:", e));
            }
        }

        if (newState.mute !== oldState.mute || newState.deaf !== oldState.deaf) return;

        if (member?.id === botID && oldID === queueVC.id && newID !== queueVC.id && newID !== undefined) {
            if (!newVCMembers) return;
            queue.skipVoters = [];
            if (oldVC?.rtcRegion !== newVC?.rtcRegion) {
                const msg = await queue.textChannel.send({ embeds: [createEmbed("info", i18n.__("events.voiceStateUpdate.reconfigureConnection"))] });
                queue.connection?.configureNetworking();

                try {
                    await entersState(queue.connection!, VoiceConnectionStatus.Ready, 20000);
                    void msg.edit({ embeds: [createEmbed("success", i18n.__("events.voiceStateUpdate.connectionReconfigured"), true)] });
                } catch (err) {
                    queue.destroy();
                    this.client.logger.info(`${this.client.shard ? `[Shard #${this.client.shard.ids[0]}]` : ""} Unable to re-configure networking on ${newState.guild.name} voice channel, the queue was deleted.`);
                    void msg.edit({ embeds: [createEmbed("error", i18n.__("events.voiceStateUpdate.unableReconfigureConnection"), true)] });
                    return;
                }
            }
            if (newVC?.type === "GUILD_STAGE_VOICE" && newState.suppress) {
                const msg = await queue.textChannel.send({ embeds: [createEmbed("info", i18n.__("events.voiceStateUpdate.joiningAsSpeaker"))] });
                const suppress = await newState.setSuppressed(false).catch(err => ({ error: err }));

                if (suppress && ("error" in suppress)) {
                    queue.destroy();
                    this.client.logger.info(`${this.client.shard ? `[Shard #${this.client.shard.ids[0]}]` : ""} Unable to join as Speaker at ${newState.guild.name} stage channel, the queue was deleted.`);
                    return queue.textChannel.send({ embeds: [createEmbed("error", i18n.__("events.voiceStateUpdate.unableJoinStageMessage"), true)] })
                        .catch(e => {
                            this.client.logger.error("VOICE_STATE_UPDATE_EVENT_ERR:", e);
                        });
                }

                await msg.edit({ embeds: [createEmbed("success", i18n.__("events.voiceStateUpdate.joinStageMessage"), true)] });
            }
            if (newVCMembers.size === 0 && queue.timeout === null && !queue.idle) {
                this.timeout(newVCMembers, queue, newState);
            } else if (newVCMembers.size !== 0 && queue.timeout !== null) {
                this.resume(newVCMembers, queue, newState);
            }
        }

        if (oldID === queueVC.id && newID !== queueVC.id && !member?.user.bot && queue.timeout === null && !queue.idle) {
            queue.skipVoters = queue.skipVoters.filter(x => x !== member?.id);
            this.timeout(queueVCMembers, queue, newState);
        }

        if (newID === queueVC.id && !member?.user.bot && queue.timeout) this.resume(queueVCMembers, queue, newState);
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
            queue.destroy();
            void queue.textChannel.send({ embeds: [createEmbed("error", `⏹ **|** ${i18n.__mf("events.voiceStateUpdate.deleteQueue", { duration: `\`${duration}\`` })}`).setAuthor(i18n.__("events.voiceStateUpdate.deleteQueueFooter"))] });
        }, timeout);
        void queue.textChannel.send({ embeds: [createEmbed("warn", `⏸ **|** ${i18n.__mf("events.voiceStateUpdate.pauseQueue", { duration: `\`${duration}\`` })}`).setAuthor(i18n.__("events.voiceStateUpdate.pauseQueueFooter"))] })
            .then(msg => queue.lastVSUpdateMsg = msg.id);
    }

    private resume(vcMembers: VoiceChannel["members"], queue: ServerQueue, state: VoiceState): void {
        if (vcMembers.size <= 0) return;

        clearTimeout(queue.timeout!);
        state.guild.queue!.timeout = null;

        const song = ((queue.player!.state as AudioPlayerPausedState).resource.metadata as IQueueSong).song;

        void queue.textChannel.send({ embeds: [createEmbed("info", `▶ **|** ${i18n.__mf("events.voiceStateUpdate.resumeQueue", { song: `[${song.title}](${song.url})` })}`).setThumbnail(song.thumbnail).setAuthor(i18n.__("events.voiceStateUpdate.resumeQueueFooter"))] }).then(msg => queue.lastVSUpdateMsg = msg.id);
        state.guild.queue?.player?.unpause();
    }
}
