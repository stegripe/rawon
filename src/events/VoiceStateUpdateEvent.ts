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

        const botId = this.client.user?.id;

        const thisBotGuild = this.client.guilds.cache.get(newState.guild.id);
        if (!thisBotGuild) {
            return;
        }

        const queue = thisBotGuild.queue;
        if (!queue) {
            return;
        }

        const __ = i18n__(this.client, thisBotGuild);
        const __mf = i18n__mf(this.client, thisBotGuild);

        const newVc = newState.channel;
        const oldVc = oldState.channel;
        const newId = newVc?.id;
        const oldId = oldVc?.id;
        const queueVc = thisBotGuild.channels.cache.get(
            queue.connection?.joinConfig.channelId ?? "",
        ) as StageChannel | VoiceChannel | undefined;

        if (!queueVc) {
            return;
        }

        const member = newState.member;
        const oldMember = oldState.member;
        const queueVcMembers = queueVc.members.filter((mbr) => !mbr.user.bot);

        if (oldMember?.id === botId && oldId === queueVc.id && newId === undefined) {
            const isIdle = queue.idle;
            const isRequestChannel = this.client.requestChannelManager.isRequestChannel(
                thisBotGuild,
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

        // Only consider it a "move" if the bot was actually in a channel before (oldId is defined)
        // If oldId is undefined, the bot just joined a new channel, not moved
        const isBotMoved =
            member?.id === botId && oldId !== undefined && oldId !== newId && newId !== undefined;

        if (isBotMoved) {
            const newChannelMembers = newVc?.members.filter((mbr) => !mbr.user.bot);
            const newChannelMemberCount = newChannelMembers?.size ?? 0;

            this.client.logger.info(
                `[VoiceState] ${this.client.user?.tag} was MOVED from ${oldId} to ${newId}, ` +
                    `newChannelMemberCount=${newChannelMemberCount}, queueVcId=${queueVc.id}, idle=${queue.idle}`,
            );

            if (newChannelMemberCount === 0 && !queue.idle) {
                this.client.logger.info(
                    `[VoiceState] ${this.client.user?.tag} moved to EMPTY channel ${newId}, triggering pause and timeout`,
                );
                queue.skipVoters = [];
                if (queue.timeout === null) {
                    const emptyMembers = newChannelMembers ?? queueVc.members.filter(() => false);
                    this.timeout(emptyMembers, queue, newState, thisBotGuild);
                }
                return;
            }

            if (
                newChannelMemberCount > 0 &&
                queue.timeout !== null &&
                newChannelMembers !== undefined
            ) {
                this.client.logger.info(
                    `[VoiceState] ${this.client.user?.tag} moved to channel ${newId} with members, resuming`,
                );
                this.resume(newChannelMembers, queue, newState, thisBotGuild);
            }

            if (!newChannelMembers) {
                return;
            }
            queue.skipVoters = [];
            const isRequestChannel = this.client.requestChannelManager.isRequestChannel(
                thisBotGuild,
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
        }

        if (
            oldId === queueVc.id &&
            newId !== queueVc.id &&
            member?.user.bot !== true &&
            queue.timeout === null &&
            !queue.idle
        ) {
            queue.skipVoters = queue.skipVoters.filter((x) => x !== member?.id);
            this.timeout(queueVcMembers, queue, newState, thisBotGuild);
        }

        if (newId === queueVc.id && member?.user.bot !== true && queue.timeout) {
            this.resume(queueVcMembers, queue, newState, thisBotGuild);
        }
    }

    private timeout(
        vcMembers: VoiceChannel["members"],
        queue: ServerQueue,
        _state: VoiceState,
        guild: typeof _state.guild,
    ): void {
        if (vcMembers.size > 0) {
            return;
        }

        const __ = i18n__(this.client, guild);
        const __mf = i18n__mf(this.client, guild);

        clearTimeout(queue.timeout ?? undefined);
        (guild.queue as unknown as ServerQueue).timeout = null;
        queue.player.pause();

        const timeout = 60_000;
        const duration = formatMS(timeout);
        const isRequestChannel = queue.client.requestChannelManager.isRequestChannel(
            guild,
            queue.textChannel.id,
        );

        queue.lastVSUpdateMsg = null;
        (guild.queue as unknown as ServerQueue).timeout = setTimeout(() => {
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
        _state: VoiceState,
        guild: typeof _state.guild,
    ): void {
        if (vcMembers.size <= 0) {
            return;
        }

        const __ = i18n__(this.client, guild);
        const __mf = i18n__mf(this.client, guild);

        clearTimeout(queue.timeout ?? undefined);
        (guild.queue as unknown as ServerQueue).timeout = null;

        const song = ((queue.player.state as AudioPlayerPausedState).resource.metadata as QueueSong)
            .song;
        const isRequestChannel = queue.client.requestChannelManager.isRequestChannel(
            guild,
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
        guild.queue?.player.unpause();
    }
}
