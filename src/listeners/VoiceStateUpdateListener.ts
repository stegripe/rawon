import { clearTimeout, setTimeout } from "node:timers";
import {
    type AudioPlayerPausedState,
    type AudioPlayerPlayingState,
    AudioPlayerStatus,
    entersState,
    VoiceConnectionStatus,
} from "@discordjs/voice";
import { ApplyOptions } from "@sapphire/decorators";
import { Events, Listener, type ListenerOptions } from "@sapphire/framework";
import {
    ChannelType,
    type Message,
    MessageFlags,
    type StageChannel,
    type VoiceChannel,
    type VoiceState,
} from "discord.js";
import { type Rawon } from "../structures/Rawon.js";
import { type RequesterDeafTimeoutReason, type ServerQueue } from "../structures/ServerQueue.js";
import { type QueueSong } from "../typings/index.js";
import { createEmbed } from "../utils/functions/createEmbed.js";
import { formatBoldMarkdownLink } from "../utils/functions/formatMarkdown.js";
import { formatMS } from "../utils/functions/formatMS.js";
import { i18n__, i18n__mf } from "../utils/functions/i18n.js";

@ApplyOptions<ListenerOptions>({
    event: Events.VoiceStateUpdate,
})
export class VoiceStateUpdateListener extends Listener<typeof Events.VoiceStateUpdate> {
    public async run(oldState: VoiceState, newState: VoiceState): Promise<Message | undefined> {
        const client = newState.client as Rawon;

        if (this.container.config.debugMode) {
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

            this.container.debugLog.logData("info", "VOICE_STATE_UPDATE", [
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

        const botId = client.user?.id;

        const thisBotGuild = client.guilds.cache.get(newState.guild.id);
        if (!thisBotGuild) {
            return;
        }

        const queue = thisBotGuild.queue;
        if (!queue) {
            return;
        }

        const __ = i18n__(client, thisBotGuild);
        const __mf = i18n__mf(client, thisBotGuild);

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
            const isRequestChannel = client.requestChannelManager.isRequestChannel(
                thisBotGuild,
                queue.textChannel.id,
            );

            await queue.destroy();
            if (!isIdle) {
                this.container.logger.info(
                    `${
                        client.shard ? `[Shard #${client.shard.ids[0]}]` : ""
                    } Disconnected from the voice channel at ${newState.guild.name}, the queue was deleted.`,
                );
                (async () => {
                    const msg = await queue.textChannel
                        .send({
                            flags: MessageFlags.SuppressNotifications,
                            embeds: [
                                createEmbed(
                                    "info",
                                    `⏹️ **|** ${__("events.voiceStateUpdate.disconnectFromVCMessage")}`,
                                ),
                            ],
                        })
                        .catch((error: unknown) => {
                            this.container.logger.error("VOICE_STATE_UPDATE_EVENT_ERR:", error);
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

        const deafChanged = newState.deaf !== oldState.deaf;
        const voiceChannelChanged = newId !== oldId;
        if (deafChanged || voiceChannelChanged) {
            await this.handleRequesterAvailabilityChange(
                oldState,
                newState,
                queue,
                thisBotGuild,
                queueVc,
            );
        }

        if (newState.mute !== oldState.mute || deafChanged) {
            if (
                deafChanged &&
                newState.deaf !== true &&
                newId === queueVc.id &&
                member?.user.bot !== true &&
                queue.timeout
            ) {
                this.resume(queueVcMembers, queue, newState, thisBotGuild);
            }
            return;
        }

        const isBotMoved =
            member?.id === botId && oldId !== undefined && oldId !== newId && newId !== undefined;

        if (isBotMoved) {
            const newChannelMembers = newVc?.members.filter((mbr) => !mbr.user.bot);
            const newChannelMemberCount = newChannelMembers?.size ?? 0;

            this.container.logger.debug(
                `[VoiceState] ${client.user?.tag} was MOVED from ${oldId} to ${newId}, ` +
                    `newChannelMemberCount=${newChannelMemberCount}, queueVcId=${queueVc.id}, idle=${queue.idle}`,
            );

            if (newChannelMemberCount === 0 && !queue.idle) {
                this.container.logger.debug(
                    `[VoiceState] ${client.user?.tag} moved to EMPTY channel ${newId}, triggering pause and timeout`,
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
                this.container.logger.debug(
                    `[VoiceState] ${client.user?.tag} moved to channel ${newId} with members, resuming`,
                );
                this.resume(newChannelMembers, queue, newState, thisBotGuild);
            }

            if (!newChannelMembers) {
                return;
            }
            queue.skipVoters = [];
            const isRequestChannel = client.requestChannelManager.isRequestChannel(
                thisBotGuild,
                queue.textChannel.id,
            );
            if (oldVc?.rtcRegion !== newVc?.rtcRegion) {
                const msg = await queue.textChannel.send({
                    flags: MessageFlags.SuppressNotifications,
                    embeds: [
                        createEmbed("info", __("events.voiceStateUpdate.reconfigureConnection")),
                    ],
                });

                queue.connection?.configureNetworking();

                try {
                    await entersState(
                        queue.connection as NonNullable<typeof queue.connection>,
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
                    await queue.destroy();
                    this.container.logger.info(
                        `${
                            client.shard ? `[Shard #${client.shard.ids[0]}]` : ""
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
                    flags: MessageFlags.SuppressNotifications,
                    embeds: [createEmbed("info", __("events.voiceStateUpdate.joiningAsSpeaker"))],
                });
                const suppress = await newState
                    .setSuppressed(false)
                    .catch((error: unknown) => ({ error }));

                if ("error" in suppress) {
                    await queue.destroy();
                    this.container.logger.info(
                        `${
                            client.shard ? `[Shard #${client.shard.ids[0]}]` : ""
                        } Unable to join as Speaker at ${newState.guild.name} stage channel, the queue was deleted.`,
                    );
                    const errorMsg = await queue.textChannel
                        .send({
                            flags: MessageFlags.SuppressNotifications,
                            embeds: [
                                createEmbed(
                                    "error",
                                    __("events.voiceStateUpdate.unableJoinStageMessage"),
                                    true,
                                ),
                            ],
                        })
                        .catch((error: unknown) => {
                            this.container.logger.error("VOICE_STATE_UPDATE_EVENT_ERR:", error);
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

    private getCurrentQueueSong(queue: ServerQueue): QueueSong | null {
        const playerState = queue.player.state;
        if (
            playerState.status !== AudioPlayerStatus.Playing &&
            playerState.status !== AudioPlayerStatus.Paused
        ) {
            return null;
        }

        return (playerState as AudioPlayerPlayingState | AudioPlayerPausedState).resource
            .metadata as QueueSong;
    }

    private async handleRequesterAvailabilityChange(
        oldState: VoiceState,
        newState: VoiceState,
        queue: ServerQueue,
        guild: VoiceState["guild"],
        queueVc: StageChannel | VoiceChannel,
    ): Promise<void> {
        const memberId = newState.member?.id ?? oldState.member?.id;
        if (!memberId || newState.member?.user.bot === true) {
            return;
        }

        const currentSong = this.getCurrentQueueSong(queue);
        if (!currentSong || currentSong.requester.id !== memberId) {
            return;
        }

        if (newState.channel?.id !== queueVc.id) {
            await this.pauseRequesterUnavailableSong(queue, guild, currentSong, "left");
            return;
        }

        if (newState.deaf === true) {
            await this.pauseRequesterUnavailableSong(queue, guild, currentSong, "deaf");
            return;
        }

        await this.resumeRequesterDeafSong(queue, guild, newState, queueVc, currentSong);
    }

    private async pauseRequesterUnavailableSong(
        queue: ServerQueue,
        guild: VoiceState["guild"],
        currentSong: QueueSong,
        reason: RequesterDeafTimeoutReason,
    ): Promise<void> {
        const pending = queue.requesterDeafTimeout;
        if (
            pending?.requesterId === currentSong.requester.id &&
            pending.songKey === currentSong.key
        ) {
            pending.reason = reason;
            return;
        }

        if (queue.player.state.status !== AudioPlayerStatus.Playing) {
            return;
        }

        const timeoutMs = 60_000;
        const timeout = setTimeout(() => {
            void this.handleRequesterDeafTimeout(
                queue,
                guild,
                currentSong.requester.id,
                currentSong.key,
                timeoutMs,
            );
        }, timeoutMs);

        queue.setRequesterDeafTimeout({
            requesterId: currentSong.requester.id,
            songKey: currentSong.key,
            reason,
            timeout,
        });
        queue.player.pause();

        const __mf = i18n__mf(queue.client, guild);
        const duration = formatMS(timeoutMs);
        const i18nKey =
            reason === "left"
                ? "events.voiceStateUpdate.pauseRequesterLeft"
                : "events.voiceStateUpdate.pauseRequesterDeaf";
        await this.sendVoiceStateMessage(
            queue,
            guild,
            createEmbed(
                "warn",
                `⏸️ **|** ${__mf(i18nKey, {
                    requester: currentSong.requester.toString(),
                    song: formatBoldMarkdownLink(currentSong.song.title, currentSong.song.url),
                    duration: `**\`${duration}\`**`,
                })}`,
            ).setThumbnail(currentSong.song.thumbnail),
        );
    }

    private async resumeRequesterDeafSong(
        queue: ServerQueue,
        guild: VoiceState["guild"],
        state: VoiceState,
        queueVc: StageChannel | VoiceChannel,
        currentSong: QueueSong,
    ): Promise<void> {
        const pending = queue.requesterDeafTimeout;
        if (pending?.requesterId !== currentSong.requester.id) {
            return;
        }

        if (pending.songKey !== currentSong.key) {
            queue.clearRequesterDeafTimeout();
            return;
        }

        if (state.channel?.id !== queueVc.id || state.deaf === true) {
            return;
        }

        queue.clearRequesterDeafTimeout();
        const i18nKey =
            pending.reason === "left"
                ? "events.voiceStateUpdate.resumeRequesterLeft"
                : "events.voiceStateUpdate.resumeRequesterDeaf";
        const shouldResumePlayer =
            queue.timeout === null && queue.player.state.status === AudioPlayerStatus.Paused;
        if (!shouldResumePlayer) {
            return;
        }

        queue.player.unpause();

        const __mf = i18n__mf(queue.client, guild);
        await this.sendVoiceStateMessage(
            queue,
            guild,
            createEmbed(
                "info",
                `▶️ **|** ${__mf(i18nKey, {
                    song: formatBoldMarkdownLink(currentSong.song.title, currentSong.song.url),
                })}`,
            ).setThumbnail(currentSong.song.thumbnail),
        );
    }

    private async handleRequesterDeafTimeout(
        queue: ServerQueue,
        guild: VoiceState["guild"],
        requesterId: string,
        songKey: string,
        timeoutMs: number,
    ): Promise<void> {
        if (guild.queue !== queue) {
            return;
        }

        const pending = queue.requesterDeafTimeout;
        if (pending?.requesterId !== requesterId || pending.songKey !== songKey) {
            return;
        }
        const timeoutReason = pending.reason;

        const currentSong = this.getCurrentQueueSong(queue);
        if (!currentSong || currentSong.key !== songKey) {
            queue.clearRequesterDeafTimeout();
            return;
        }

        const queueVc = guild.channels.cache.get(queue.connection?.joinConfig.channelId ?? "") as
            | StageChannel
            | VoiceChannel
            | undefined;
        const requester = queueVc?.members.get(requesterId) ?? guild.members.cache.get(requesterId);
        const requesterCanListen =
            queueVc !== undefined &&
            requester?.voice.channelId === queueVc.id &&
            requester.voice.deaf !== true;

        if (requesterCanListen) {
            queue.clearRequesterDeafTimeout();
            if (queue.timeout === null && queue.player.state.status === AudioPlayerStatus.Paused) {
                queue.player.unpause();
            }
            return;
        }

        const requesterSongs = queue.songs.filter((song) => song.requester.id === requesterId);
        const removedCount = requesterSongs.size + (requesterSongs.has(currentSong.key) ? 0 : 1);

        queue.clearRequesterDeafTimeout();
        for (const song of requesterSongs.values()) {
            queue.songs.delete(song.key);
        }
        queue.songs.delete(currentSong.key);
        queue.skipVoters = [];

        const __mf = i18n__mf(queue.client, guild);
        const duration = formatMS(timeoutMs);
        const i18nKey =
            timeoutReason === "left"
                ? "events.voiceStateUpdate.removeRequesterLeft"
                : "events.voiceStateUpdate.removeRequesterDeaf";
        await this.sendVoiceStateMessage(
            queue,
            guild,
            createEmbed(
                "info",
                `⏭️ **|** ${__mf(i18nKey, {
                    requester: `<@${requesterId}>`,
                    count: `**\`${removedCount}\`**`,
                    duration: `**\`${duration}\`**`,
                })}`,
            ).setThumbnail(currentSong.song.thumbnail),
        );

        if (queue.songs.size === 0) {
            await queue.destroy();
            return;
        }

        queue.player.stop(true);
    }

    private async sendVoiceStateMessage(
        queue: ServerQueue,
        guild: VoiceState["guild"],
        embed: ReturnType<typeof createEmbed>,
    ): Promise<void> {
        const isRequestChannel = queue.client.requestChannelManager.isRequestChannel(
            guild,
            queue.textChannel.id,
        );
        const msg = await queue.textChannel
            .send({
                flags: MessageFlags.SuppressNotifications,
                embeds: [embed],
            })
            .catch((error: unknown) => {
                this.container.logger.error("VOICE_STATE_UPDATE_EVENT_ERR:", error);
                return null;
            });

        if (!msg) {
            return;
        }

        queue.lastVSUpdateMsg = msg.id;
        if (isRequestChannel) {
            setTimeout(() => {
                void msg.delete().catch(() => null);
            }, 60_000);
        }
    }

    private timeout(
        vcMembers: VoiceChannel["members"],
        queue: ServerQueue,
        _state: VoiceState,
        guild: typeof _state.guild,
    ): void {
        const client = _state.client as Rawon;

        if (vcMembers.size > 0) {
            return;
        }

        const __ = i18n__(client, guild);
        const __mf = i18n__mf(client, guild);

        clearTimeout(queue.timeout ?? undefined);
        (guild.queue as ServerQueue).timeout = null;
        queue.player.pause();

        const timeout = 60_000;
        const duration = formatMS(timeout);
        const isRequestChannel = queue.client.requestChannelManager.isRequestChannel(
            guild,
            queue.textChannel.id,
        );

        queue.lastVSUpdateMsg = null;
        (guild.queue as ServerQueue).timeout = setTimeout(async () => {
            await queue.destroy();
            void (async () => {
                const msg = await queue.textChannel.send({
                    flags: MessageFlags.SuppressNotifications,
                    embeds: [
                        createEmbed(
                            "info",
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
                flags: MessageFlags.SuppressNotifications,
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
        const client = _state.client as Rawon;

        if (vcMembers.size <= 0) {
            return;
        }

        const __ = i18n__(client, guild);
        const __mf = i18n__mf(client, guild);

        clearTimeout(queue.timeout ?? undefined);
        (guild.queue as ServerQueue).timeout = null;

        if (queue.requesterDeafTimeout) {
            return;
        }

        const song = ((queue.player.state as AudioPlayerPausedState).resource.metadata as QueueSong)
            .song;
        const isRequestChannel = queue.client.requestChannelManager.isRequestChannel(
            guild,
            queue.textChannel.id,
        );

        (async () => {
            const msg = await queue.textChannel.send({
                flags: MessageFlags.SuppressNotifications,
                embeds: [
                    createEmbed(
                        "info",
                        `▶️ **|** ${__mf("events.voiceStateUpdate.resumeQueue", {
                            song: formatBoldMarkdownLink(song.title, song.url),
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
