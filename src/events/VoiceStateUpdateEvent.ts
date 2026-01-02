import { clearTimeout, setTimeout } from "node:timers";
import { type AudioPlayerPausedState, entersState, VoiceConnectionStatus } from "@discordjs/voice";
import {
    ChannelType,
    type Message,
    type StageChannel,
    type VoiceChannel,
    type VoiceState,
} from "discord.js";
import { BaseEvent } from "../structures/BaseEvent.js";
import { type ServerQueue } from "../structures/ServerQueue.js";
import { type QueueSong } from "../typings/index.js";
import { Event } from "../utils/decorators/Event.js";
import { createEmbed } from "../utils/functions/createEmbed.js";
import { formatMS } from "../utils/functions/formatMS.js";
import { i18n__, i18n__mf } from "../utils/functions/i18n.js";

@Event<typeof VoiceStateUpdateEvent>("voiceStateUpdate")
export class VoiceStateUpdateEvent extends BaseEvent {
    public async execute(oldState: VoiceState, newState: VoiceState): Promise<Message | undefined> {
        if (this.client.config.debugMode) {
            const oldCh = oldState.channel
                ? `${oldState.channel.name}(${oldState.channel.id})`
                : "Not connected";
            const newCh = newState.channel
                ? `${newState.channel.name}(${newState.channel.id})`
                : "Not connected";
            const chDiff =
                oldState.channel?.id === newState.channel?.id
                    ? []
                    : [["Channel", `${oldCh} -> ${newCh}`]];

            const oldServM = oldState.serverMute === true ? "Muted" : "Unmuted";
            const newServM = newState.serverMute === true ? "Muted" : "Unmuted";
            const servMute =
                oldServM === newServM ? [] : [["Server Mute", `${oldServM} -> ${newServM}`]];

            const oldSelfM = oldState.selfMute === true ? "Muted" : "Unmuted";
            const newSelfM = newState.selfMute === true ? "Muted" : "Unmuted";
            const selfMute =
                oldSelfM === newSelfM ? [] : [["Self Mute", `${oldSelfM} -> ${newSelfM}`]];

            const oldServD = oldState.serverDeaf === true ? "Deaf" : "Undeaf";
            const newServD = newState.serverDeaf === true ? "Deaf" : "Undeaf";
            const servDeaf =
                oldServD === newServD ? [] : [["Server Deaf", `${oldServD} -> ${newServD}`]];

            const oldSelfD = oldState.selfDeaf === true ? "Deaf" : "Undeaf";
            const newSelfD = newState.selfDeaf === true ? "Deaf" : "Undeaf";
            const selfDeaf =
                oldSelfD === newSelfD ? [] : [["Self Deaf", `${oldSelfD} -> ${newSelfD}`]];

            this.client.debugLog.logData("info", "VOICE_STATE_UPDATE", [
                ["Guild", `${oldState.guild.name}(${oldState.guild.id})`],
                [
                    "User",
                    oldState.member
                        ? `${oldState.member.user.tag}(${oldState.member.user.id})`
                        : "[???]",
                ],
                ...chDiff,
                ...servMute,
                ...selfMute,
                ...servDeaf,
                ...selfDeaf,
            ]);
        }

        const queue = newState.guild.queue;
        if (!queue) {
            return;
        }

        // In multi-bot mode, only handle events for this bot's queue
        // The queue's client reference should match this client
        if (this.client.multiBotManager.isMultiBotActive()) {
            const queueClientId = queue.client.user?.id;
            const thisClientId = this.client.user?.id;
            if (!queueClientId || !thisClientId || queueClientId !== thisClientId) {
                return;
            }
        }

        const __ = i18n__(this.client, newState.guild);
        const __mf = i18n__mf(this.client, newState.guild);

        const newVc = newState.channel;
        const oldVc = oldState.channel;
        const newId = newVc?.id;
        const oldId = oldVc?.id;
        const queueVc = newState.guild.channels.cache.get(
            queue.connection?.joinConfig.channelId ?? "",
        ) as StageChannel | VoiceChannel;
        const member = newState.member;
        const oldMember = oldState.member;
        const newVcMembers = newVc?.members.filter((mbr) => !mbr.user.bot);
        const queueVcMembers = queueVc.members.filter((mbr) => !mbr.user.bot);
        const botId = this.client.user?.id;

        if (oldMember?.id === botId && oldId === queueVc.id && newId === undefined) {
            const isIdle = queue.idle;
            const isRequestChannel = this.client.requestChannelManager.isRequestChannel(
                newState.guild,
                queue.textChannel.id,
            );

            queue.destroy();
            if (!isIdle) {
                this.client.logger.info(
                    `${
                        this.client.shard ? `[Shard #${this.client.shard.ids[0]}]` : ""
                    } Disconnected from the voice channel at ${newState.guild.name}, the queue was deleted.`,
                );
                (async () => {
                    const msg = await queue.textChannel
                        .send({
                            embeds: [
                                createEmbed(
                                    "error",
                                    `⏹️ **|** ${__("events.voiceStateUpdate.disconnectFromVCMessage")}`,
                                ),
                            ],
                        })
                        .catch((error: unknown) => {
                            this.client.logger.error("VOICE_STATE_UPDATE_EVENT_ERR:", error);
                            return null;
                        });
                    if (msg && isRequestChannel) {
                        setTimeout(() => {
                            void msg.delete().catch(() => null);
                        }, 60_000);
                    }
                })();
            }
        }

        if (newState.mute !== oldState.mute || newState.deaf !== oldState.deaf) {
            return;
        }

        if (
            member?.id === botId &&
            oldId === queueVc.id &&
            newId !== queueVc.id &&
            newId !== undefined
        ) {
            if (!newVcMembers) {
                return;
            }
            queue.skipVoters = [];
            const isRequestChannel = this.client.requestChannelManager.isRequestChannel(
                newState.guild,
                queue.textChannel.id,
            );
            if (oldVc?.rtcRegion !== newVc?.rtcRegion) {
                const msg = await queue.textChannel.send({
                    embeds: [
                        createEmbed("info", __("events.voiceStateUpdate.reconfigureConnection")),
                    ],
                });

                queue.connection?.configureNetworking();

                try {
                    await entersState(
                        queue.connection as unknown as NonNullable<typeof queue.connection>,
                        VoiceConnectionStatus.Ready,
                        20_000,
                    );
                    void msg.edit({
                        embeds: [
                            createEmbed(
                                "success",
                                __("events.voiceStateUpdate.connectionReconfigured"),
                                true,
                            ),
                        ],
                    });
                    if (isRequestChannel) {
                        setTimeout(() => {
                            void msg.delete().catch(() => null);
                        }, 10_000);
                    }
                } catch {
                    queue.destroy();
                    this.client.logger.info(
                        `${
                            this.client.shard ? `[Shard #${this.client.shard.ids[0]}]` : ""
                        } Unable to re-configure networking on ${
                            newState.guild.name
                        } voice channel, the queue was deleted.`,
                    );
                    void msg.edit({
                        embeds: [
                            createEmbed(
                                "error",
                                __("events.voiceStateUpdate.unableReconfigureConnection"),
                                true,
                            ),
                        ],
                    });
                    if (isRequestChannel) {
                        setTimeout(() => {
                            void msg.delete().catch(() => null);
                        }, 10_000);
                    }
                    return;
                }
            }
            if (newVc?.type === ChannelType.GuildStageVoice && newState.suppress === true) {
                const msg = await queue.textChannel.send({
                    embeds: [createEmbed("info", __("events.voiceStateUpdate.joiningAsSpeaker"))],
                });
                const suppress = await newState
                    .setSuppressed(false)
                    .catch((error: unknown) => ({ error }));

                if ("error" in suppress) {
                    queue.destroy();
                    this.client.logger.info(
                        `${
                            this.client.shard ? `[Shard #${this.client.shard.ids[0]}]` : ""
                        } Unable to join as Speaker at ${newState.guild.name} stage channel, the queue was deleted.`,
                    );
                    const errorMsg = await queue.textChannel
                        .send({
                            embeds: [
                                createEmbed(
                                    "error",
                                    __("events.voiceStateUpdate.unableJoinStageMessage"),
                                    true,
                                ),
                            ],
                        })
                        .catch((error: unknown) => {
                            this.client.logger.error("VOICE_STATE_UPDATE_EVENT_ERR:", error);
                            return null;
                        });
                    if (isRequestChannel) {
                        void msg.delete().catch(() => null);
                        if (errorMsg) {
                            setTimeout(() => {
                                void errorMsg.delete().catch(() => null);
                            }, 10_000);
                        }
                    }
                    return;
                }

                await msg.edit({
                    embeds: [
                        createEmbed(
                            "success",
                            __("events.voiceStateUpdate.joinStageMessage"),
                            true,
                        ),
                    ],
                });
                if (isRequestChannel) {
                    setTimeout(() => {
                        void msg.delete().catch(() => null);
                    }, 10_000);
                }
            }
            if (newVcMembers.size === 0 && queue.timeout === null && !queue.idle) {
                this.timeout(newVcMembers, queue, newState);
            } else if (newVcMembers.size > 0 && queue.timeout !== null) {
                this.resume(newVcMembers, queue, newState);
            }
        }

        if (
            oldId === queueVc.id &&
            newId !== queueVc.id &&
            member?.user.bot !== true &&
            queue.timeout === null &&
            !queue.idle
        ) {
            queue.skipVoters = queue.skipVoters.filter((x) => x !== member?.id);
            this.timeout(queueVcMembers, queue, newState);
        }

        if (newId === queueVc.id && member?.user.bot !== true && queue.timeout) {
            this.resume(queueVcMembers, queue, newState);
        }
    }

    private timeout(
        vcMembers: VoiceChannel["members"],
        queue: ServerQueue,
        state: VoiceState,
    ): void {
        if (vcMembers.size > 0) {
            return;
        }

        const __ = i18n__(this.client, state.guild);
        const __mf = i18n__mf(this.client, state.guild);

        clearTimeout(queue.timeout ?? undefined);
        (state.guild.queue as unknown as ServerQueue).timeout = null;
        queue.player.pause();

        const timeout = 60_000;
        const duration = formatMS(timeout);
        const isRequestChannel = queue.client.requestChannelManager.isRequestChannel(
            state.guild,
            queue.textChannel.id,
        );

        queue.lastVSUpdateMsg = null;
        (state.guild.queue as unknown as ServerQueue).timeout = setTimeout(() => {
            queue.destroy();
            void (async () => {
                const msg = await queue.textChannel.send({
                    embeds: [
                        createEmbed(
                            "error",
                            `⏹️ **|** ${__mf("events.voiceStateUpdate.deleteQueue", {
                                duration: `**\`${duration}\`**`,
                            })}`,
                        ).setAuthor({ name: __("events.voiceStateUpdate.deleteQueueFooter") }),
                    ],
                });
                if (isRequestChannel) {
                    setTimeout(() => {
                        void msg.delete().catch(() => null);
                    }, 60_000);
                }
            })();
        }, timeout);
        (async () => {
            const msg = await queue.textChannel.send({
                embeds: [
                    createEmbed(
                        "warn",
                        `⏸️ **|** ${__mf("events.voiceStateUpdate.pauseQueue", {
                            duration: `**\`${duration}\`**`,
                        })}`,
                    ).setAuthor({ name: __("events.voiceStateUpdate.pauseQueueFooter") }),
                ],
            });
            queue.lastVSUpdateMsg = msg.id;
            if (isRequestChannel) {
                setTimeout(() => {
                    void msg.delete().catch(() => null);
                }, 60_000);
            }
        })();
    }

    private resume(
        vcMembers: VoiceChannel["members"],
        queue: ServerQueue,
        state: VoiceState,
    ): void {
        if (vcMembers.size <= 0) {
            return;
        }

        const __ = i18n__(this.client, state.guild);
        const __mf = i18n__mf(this.client, state.guild);

        clearTimeout(queue.timeout ?? undefined);
        (state.guild.queue as unknown as ServerQueue).timeout = null;

        const song = ((queue.player.state as AudioPlayerPausedState).resource.metadata as QueueSong)
            .song;
        const isRequestChannel = queue.client.requestChannelManager.isRequestChannel(
            state.guild,
            queue.textChannel.id,
        );

        (async () => {
            const msg = await queue.textChannel.send({
                embeds: [
                    createEmbed(
                        "info",
                        `▶️ **|** ${__mf("events.voiceStateUpdate.resumeQueue", {
                            song: `**[${song.title}](${song.url})**`,
                        })}`,
                    )
                        .setThumbnail(song.thumbnail)
                        .setAuthor({
                            name: __("events.voiceStateUpdate.resumeQueueFooter"),
                        }),
                ],
            });
            queue.lastVSUpdateMsg = msg.id;
            if (isRequestChannel) {
                setTimeout(() => {
                    void msg.delete().catch(() => null);
                }, 60_000);
            }
        })();
        state.guild.queue?.player.unpause();
    }
}
