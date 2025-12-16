import { clearTimeout, setTimeout } from "node:timers";
import { AudioPlayerPausedState, entersState, VoiceConnectionStatus } from "@discordjs/voice";
import { ChannelType, Message, StageChannel, VoiceState, VoiceChannel } from "discord.js";
import i18n from "../config/index.js";
import { BaseEvent } from "../structures/BaseEvent.js";
import { ServerQueue } from "../structures/ServerQueue.js";
import { QueueSong } from "../typings/index.js";
import { Event } from "../utils/decorators/Event.js";
import { createEmbed } from "../utils/functions/createEmbed.js";
import { formatMS } from "../utils/functions/formatMS.js";

@Event<typeof VoiceStateUpdateEvent>("voiceStateUpdate")
export class VoiceStateUpdateEvent extends BaseEvent {
    public async execute(oldState: VoiceState, newState: VoiceState): Promise<Message | undefined> {
        if (this.client.config.debugMode) {
            const oldCh = oldState.channel ? `${oldState.channel.name}(${oldState.channel.id})` : "Not connected";
            const newCh = newState.channel ? `${newState.channel.name}(${newState.channel.id})` : "Not connected";
            const chDiff = oldState.channel?.id === newState.channel?.id ? [] : [["Channel", `${oldCh} -> ${newCh}`]];

            const oldServM = oldState.serverMute === true ? "Muted" : "Unmuted";
            const newServM = newState.serverMute === true ? "Muted" : "Unmuted";
            const servMute = oldServM === newServM ? [] : [["Server Mute", `${oldServM} -> ${newServM}`]];

            const oldSelfM = oldState.selfMute === true ? "Muted" : "Unmuted";
            const newSelfM = newState.selfMute === true ? "Muted" : "Unmuted";
            const selfMute = oldSelfM === newSelfM ? [] : [["Self Mute", `${oldSelfM} -> ${newSelfM}`]];

            const oldServD = oldState.serverDeaf === true ? "Deaf" : "Undeaf";
            const newServD = newState.serverDeaf === true ? "Deaf" : "Undeaf";
            const servDeaf = oldServD === newServD ? [] : [["Server Deaf", `${oldServD} -> ${newServD}`]];

            const oldSelfD = oldState.selfDeaf === true ? "Deaf" : "Undeaf";
            const newSelfD = newState.selfDeaf === true ? "Deaf" : "Undeaf";
            const selfDeaf = oldSelfD === newSelfD ? [] : [["Self Deaf", `${oldSelfD} -> ${newSelfD}`]];

            this.client.debugLog.logData("info", "VOICE_STATE_UPDATE", [
                ["Guild", `${oldState.guild.name}(${oldState.guild.id})`],
                ["User", oldState.member ? `${oldState.member.user.tag}(${oldState.member.user.id})` : "[???]"],
                ...chDiff,
                ...servMute,
                ...selfMute,
                ...servDeaf,
                ...selfDeaf
            ]);
        }

        const queue = newState.guild.queue;
        if (!queue) return;

        const newVC = newState.channel;
        const oldVC = oldState.channel;
        const newID = newVC?.id;
        const oldID = oldVC?.id;
        const queueVC = newState.guild.channels.cache.get(queue.connection?.joinConfig.channelId ?? "") as
            | StageChannel
            | VoiceChannel;
        const member = newState.member;
        const oldMember = oldState.member;
        const newVCMembers = newVC?.members.filter(mbr => !mbr.user.bot);
        const queueVCMembers = queueVC.members.filter(mbr => !mbr.user.bot);
        const botID = this.client.user?.id;

        if (oldMember?.id === botID && oldID === queueVC.id && newID === undefined) {
            const isIdle = queue.idle;

            queue.destroy();
            if (!isIdle) {
                this.client.logger.info(
                    `${this.client.shard ? `[Shard #${this.client.shard.ids[0]}]` : ""
                    } Disconnected from the voice channel at ${newState.guild.name}, the queue was deleted.`
                );
                (async () => {
                    await queue.textChannel
                    .send({
                        embeds: [
                            createEmbed(
                                "error",
                                `⏹️ **|** ${i18n.__("events.voiceStateUpdate.disconnectFromVCMessage")}`
                            )
                        ]
                    })
                    .catch((error: unknown) => this.client.logger.error("VOICE_STATE_UPDATE_EVENT_ERR:", error))
                })();
            }
        }

        if (newState.mute !== oldState.mute || newState.deaf !== oldState.deaf) return;

        if (member?.id === botID && oldID === queueVC.id && newID !== queueVC.id && newID !== undefined) {
            if (!newVCMembers) return;
            queue.skipVoters = [];
            if (oldVC?.rtcRegion !== newVC?.rtcRegion) {
                const msg = await queue.textChannel.send({
                    embeds: [createEmbed("info", i18n.__("events.voiceStateUpdate.reconfigureConnection"))]
                });
                queue.connection?.configureNetworking();

                try {
                    await entersState(queue.connection as unknown as NonNullable<typeof queue.connection>, VoiceConnectionStatus.Ready, 20_000);
                    void msg.edit({
                        embeds: [
                            createEmbed("success", i18n.__("events.voiceStateUpdate.connectionReconfigured"), true)
                        ]
                    });
                } catch {
                    queue.destroy();
                    this.client.logger.info(
                        `${this.client.shard ? `[Shard #${this.client.shard.ids[0]}]` : ""
                        } Unable to re-configure networking on ${newState.guild.name
                        } voice channel, the queue was deleted.`
                    );
                    void msg.edit({
                        embeds: [
                            createEmbed("error", i18n.__("events.voiceStateUpdate.unableReconfigureConnection"), true)
                        ]
                    });
                    return;
                }
            }
            if (newVC?.type === ChannelType.GuildStageVoice && newState.suppress === true) {
                const msg = await queue.textChannel.send({
                    embeds: [createEmbed("info", i18n.__("events.voiceStateUpdate.joiningAsSpeaker"))]
                });
                const suppress = await newState.setSuppressed(false).catch((error: unknown) => ({ error }));

                if ("error" in suppress) {
                    queue.destroy();
                    this.client.logger.info(
                        `${this.client.shard ? `[Shard #${this.client.shard.ids[0]}]` : ""
                        } Unable to join as Speaker at ${newState.guild.name} stage channel, the queue was deleted.`
                    );
                    await queue.textChannel
                        .send({
                            embeds: [
                                createEmbed("error", i18n.__("events.voiceStateUpdate.unableJoinStageMessage"), true)
                            ]
                        })
                        .catch((error: unknown) => {
                            this.client.logger.error("VOICE_STATE_UPDATE_EVENT_ERR:", error);
                        });
                    return;
                }

                await msg.edit({
                    embeds: [createEmbed("success", i18n.__("events.voiceStateUpdate.joinStageMessage"), true)]
                });
            }
            if (newVCMembers.size === 0 && queue.timeout === null && !queue.idle) {
                this.timeout(newVCMembers, queue, newState);
            } else if (newVCMembers.size > 0 && queue.timeout !== null) {
                this.resume(newVCMembers, queue, newState);
            }
        }

        if (
            oldID === queueVC.id &&
            newID !== queueVC.id &&
            member?.user.bot !== true &&
            queue.timeout === null &&
            !queue.idle
        ) {
            queue.skipVoters = queue.skipVoters.filter(x => x !== member?.id);
            this.timeout(queueVCMembers, queue, newState);
        }

        if (newID === queueVC.id && member?.user.bot !== true && queue.timeout) this.resume(queueVCMembers, queue, newState);
    }

    private timeout(vcMembers: VoiceChannel["members"], queue: ServerQueue, state: VoiceState): void {
        if (vcMembers.size > 0) return;

        clearTimeout(queue.timeout ?? undefined);
        (state.guild.queue as unknown as ServerQueue).timeout = null;
        queue.player.pause();

        const timeout = 60_000;
        const duration = formatMS(timeout);

        queue.lastVSUpdateMsg = null;
        (state.guild.queue as unknown as ServerQueue).timeout = setTimeout(() => {
            queue.destroy();
            void queue.textChannel.send({
                embeds: [
                    createEmbed(
                        "error",
                        `⏹️ **|** ${i18n.__mf("events.voiceStateUpdate.deleteQueue", {
                            duration: `\`${duration}\``
                        })}`
                    ).setAuthor({ name: i18n.__("events.voiceStateUpdate.deleteQueueFooter") })
                ]
            });
        }, timeout);
        (async () => {
            await queue.textChannel
            .send({
                embeds: [
                    createEmbed(
                        "warn",
                        `⏸️ **|** ${i18n.__mf("events.voiceStateUpdate.pauseQueue", {
                            duration: `\`${duration}\``
                        })}`
                    ).setAuthor({ name: i18n.__("events.voiceStateUpdate.pauseQueueFooter") })
                ]
            })
            .then(msg => (queue.lastVSUpdateMsg = msg.id))
        })();
    }

    private resume(vcMembers: VoiceChannel["members"], queue: ServerQueue, state: VoiceState): void {
        if (vcMembers.size <= 0) return;

        clearTimeout(queue.timeout ?? undefined);
        (state.guild.queue as unknown as ServerQueue).timeout = null;

        const song = ((queue.player.state as AudioPlayerPausedState).resource.metadata as QueueSong).song;

        (async () => {
            await queue.textChannel
            .send({
                embeds: [
                    createEmbed(
                        "info",
                        `▶️ **|** ${i18n.__mf("events.voiceStateUpdate.resumeQueue", {
                            song: `[${song.title}](${song.url})`
                        })}`
                    )
                        .setThumbnail(song.thumbnail)
                        .setAuthor({
                            name: i18n.__("events.voiceStateUpdate.resumeQueueFooter")
                        })
                ]
            })
            .then(msg => (queue.lastVSUpdateMsg = msg.id))
        })();
        state.guild.queue?.player.unpause();
    }
}
