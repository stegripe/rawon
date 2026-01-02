import { setTimeout } from "node:timers";
import { type AudioPlayerPlayingState } from "@discordjs/voice";
import {
    ActionRowBuilder,
    ApplicationCommandType,
    type BitFieldResolvable,
    ButtonBuilder,
    type ButtonInteraction,
    ButtonStyle,
    ComponentType,
    type GuildMember,
    type Interaction,
    Message,
    MessageFlags,
    PermissionsBitField,
    type PermissionsString,
    type TextChannel,
} from "discord.js";
import { BaseEvent } from "../structures/BaseEvent.js";
import { CommandContext } from "../structures/CommandContext.js";
import { type ServerQueue } from "../structures/ServerQueue.js";
import { type LoopMode, type LyricsAPIResult, type QueueSong } from "../typings/index.js";
import { Event } from "../utils/decorators/Event.js";
import { chunk } from "../utils/functions/chunk.js";
import { createEmbed } from "../utils/functions/createEmbed.js";
import { i18n__, i18n__mf } from "../utils/functions/i18n.js";
import { type SongManager } from "../utils/structures/SongManager.js";

@Event("interactionCreate")
export class InteractionCreateEvent extends BaseEvent {
    public async execute(interaction: Interaction): Promise<void> {
        this.client.debugLog.logData("info", "INTERACTION_CREATE", [
            ["Type", interaction.type.toString()],
            [
                "Guild",
                interaction.inGuild()
                    ? `${interaction.guild?.name ?? "[???]"}(${interaction.guildId})`
                    : "DM",
            ],
            [
                "Channel",
                (interaction.channel?.type ?? "DM") === "DM"
                    ? "DM"
                    : `${(interaction.channel as TextChannel).name}(${(interaction.channel as TextChannel).id})`,
            ],
            ["User", `${interaction.user.tag}(${interaction.user.id})`],
        ]);

        if (!interaction.inGuild() || !this.client.commands.isReady) {
            return;
        }

        const __mf = i18n__mf(this.client, interaction.guild);

        if (interaction.isButton()) {
            if (interaction.customId.startsWith("RC_")) {
                await this.handleRequestChannelButton(interaction);
                return;
            }

            const val = this.client.utils.decode(interaction.customId);
            const user = val.split("_")[0] ?? "";
            const cmd = val.split("_")[1] ?? "";

            if (cmd === "delete-msg") {
                if (
                    interaction.user.id !== user &&
                    !new PermissionsBitField(
                        interaction.member.permissions as
                            | BitFieldResolvable<PermissionsString, bigint>
                            | undefined,
                    ).has(PermissionsBitField.Flags.ManageMessages)
                ) {
                    void interaction.reply({
                        flags: MessageFlags.Ephemeral,
                        embeds: [
                            createEmbed(
                                "error",
                                __mf("events.createInteraction.message1", {
                                    user: user.toString(),
                                }),
                                true,
                            ),
                        ],
                    });
                } else {
                    const msg = await interaction.channel?.messages
                        .fetch(interaction.message.id)
                        .catch(() => null);
                    if (msg?.deletable === true) {
                        void msg.delete();
                    }
                }
            }
        }

        const context = new CommandContext(interaction);
        if (interaction.isUserContextMenuCommand()) {
            const data =
                interaction.options.getUser("user") ?? interaction.options.get("message")?.message;
            let dataType = ApplicationCommandType.User;

            if (data instanceof Message) {
                dataType = ApplicationCommandType.Message;
            }

            const cmd = this.client.commands.find((x) =>
                dataType === ApplicationCommandType.Message
                    ? x.meta.contextChat === interaction.commandName
                    : x.meta.contextUser === interaction.commandName,
            );
            if (cmd) {
                context.additionalArgs.set("options", data);
                void cmd.execute(context);
            }
        }

        if (interaction.isCommand()) {
            const cmd = this.client.commands
                .filter((x) => x.meta.slash !== undefined)
                .find((x) => x.meta.slash?.name === interaction.commandName);
            if (cmd) {
                this.client.logger.info(
                    `${interaction.user.tag} [${interaction.user.id}] used /${interaction.commandName} ` +
                        `in #${(interaction.channel as TextChannel)?.name ?? "unknown"} [${interaction.channelId}] ` +
                        `in guild: ${interaction.guild?.name} [${interaction.guildId}]`,
                );
                void cmd.execute(context);
            }
        }

        if (interaction.isStringSelectMenu()) {
            const val = this.client.utils.decode(interaction.customId);
            const user = val.split("_")[0] ?? "";
            const cmd = val.split("_")[1] ?? "";
            const exec = (val.split("_")[2] ?? "yes") === "yes";

            if (interaction.user.id !== user) {
                void interaction.reply({
                    flags: MessageFlags.Ephemeral,
                    embeds: [
                        createEmbed(
                            "error",
                            __mf("events.createInteraction.message1", {
                                user: user.toString(),
                            }),
                            true,
                        ),
                    ],
                });
            }
            if (cmd && user === interaction.user.id && exec) {
                const command = this.client.commands
                    .filter((x) => x.meta.slash !== undefined)
                    .find((x) => x.meta.name === cmd);
                if (command) {
                    context.additionalArgs.set("values", interaction.values);
                    void command.execute(context);
                }
            }
        }
    }

    private async handleRequestChannelButton(interaction: ButtonInteraction): Promise<void> {
        const guild = interaction.guild;
        if (!guild) {
            return;
        }

        const __ = i18n__(this.client, guild);
        const __mf = i18n__mf(this.client, guild);

        this.client.logger.info(
            `${interaction.user.tag} [${interaction.user.id}] clicked ${interaction.customId} button ` +
                `in guild: ${guild.name} [${guild.id}]`,
        );

        const member = guild.members.cache.get(interaction.user.id);
        const voiceChannel = member?.voice.channel;
        const queue = guild.queue;

        if (interaction.customId === "RC_LYRICS") {
            await this.handleLyricsButton(interaction, queue);
            return;
        }

        if (!voiceChannel) {
            await interaction.reply({
                flags: MessageFlags.Ephemeral,
                embeds: [createEmbed("warn", __("requestChannel.notInVoice"))],
            });
            return;
        }

        const botVoiceChannel = guild.members.me?.voice.channel;
        if (botVoiceChannel && voiceChannel.id !== botVoiceChannel.id) {
            await interaction.reply({
                flags: MessageFlags.Ephemeral,
                embeds: [createEmbed("warn", __("utils.musicDecorator.sameVC"))],
            });
            return;
        }

        switch (interaction.customId) {
            case "RC_PAUSE_RESUME": {
                if (!queue || queue.songs.size === 0) {
                    await interaction.reply({
                        flags: MessageFlags.Ephemeral,
                        embeds: [createEmbed("warn", __("requestChannel.nothingPlaying"))],
                    });
                    return;
                }

                if (queue.playing) {
                    queue.playing = false;
                    await interaction.reply({
                        flags: MessageFlags.Ephemeral,
                        embeds: [createEmbed("success", `⏸️ **|** ${__("requestChannel.paused")}`)],
                    });
                    setTimeout(async () => {
                        try {
                            await interaction.deleteReply();
                        } catch {
                            // Ignore errors
                        }
                    }, 60_000);
                } else {
                    queue.playing = true;
                    await interaction.reply({
                        flags: MessageFlags.Ephemeral,
                        embeds: [createEmbed("success", `▶️ **|** ${__("requestChannel.resumed")}`)],
                    });
                    setTimeout(async () => {
                        try {
                            await interaction.deleteReply();
                        } catch {
                            // Ignore errors
                        }
                    }, 60_000);
                }
                break;
            }

            case "RC_SKIP": {
                if (!queue || queue.songs.size === 0) {
                    await interaction.reply({
                        flags: MessageFlags.Ephemeral,
                        embeds: [createEmbed("warn", __("requestChannel.nothingPlaying"))],
                    });
                    return;
                }

                if (!queue.canSkip()) {
                    await interaction.reply({
                        flags: MessageFlags.Ephemeral,
                        embeds: [createEmbed("warn", __("requestChannel.skipInProgress"))],
                    });
                    return;
                }

                const skipSong = (
                    queue.player.state as
                        | (AudioPlayerPlayingState & { resource?: { metadata?: QueueSong } })
                        | undefined
                )?.resource?.metadata;

                const { hasPermission } = await this.checkMusicPermission(
                    interaction,
                    member,
                    skipSong,
                );

                if (!hasPermission) {
                    const canSkip = await this.handleSkipVoting(
                        interaction,
                        queue,
                        member as GuildMember,
                    );
                    if (!canSkip) {
                        return;
                    }
                }

                if (!queue.startSkip()) {
                    await interaction.reply({
                        flags: MessageFlags.Ephemeral,
                        embeds: [createEmbed("warn", __("requestChannel.skipInProgress"))],
                    });
                    return;
                }

                if (!queue.playing) {
                    queue.playing = true;
                }
                queue.player.stop(true);

                const skipEmbed = createEmbed(
                    "success",
                    `⏭️ **|** ${__mf("requestChannel.skipped", { song: skipSong ? `**[${skipSong.song.title}](${skipSong.song.url})**` : "" })}`,
                );
                if (skipSong?.song.thumbnail) {
                    skipEmbed.setThumbnail(skipSong.song.thumbnail);
                }

                await interaction.reply({
                    flags: MessageFlags.Ephemeral,
                    embeds: [skipEmbed],
                });
                setTimeout(async () => {
                    try {
                        await interaction.deleteReply();
                    } catch {
                        // Ignore errors
                    }
                }, 60_000);
                break;
            }

            case "RC_STOP": {
                if (!queue) {
                    await interaction.reply({
                        flags: MessageFlags.Ephemeral,
                        embeds: [createEmbed("warn", __("requestChannel.nothingPlaying"))],
                    });
                    return;
                }

                const stopSong = (
                    queue.player.state as
                        | (AudioPlayerPlayingState & { resource?: { metadata?: QueueSong } })
                        | undefined
                )?.resource?.metadata;

                const { hasPermission: hasStopPermission } = await this.checkMusicPermission(
                    interaction,
                    member,
                    stopSong,
                );

                if (!hasStopPermission) {
                    await interaction.reply({
                        flags: MessageFlags.Ephemeral,
                        embeds: [createEmbed("error", __("requestChannel.noPermission"), true)],
                    });
                    return;
                }

                queue.destroy();
                await interaction.reply({
                    flags: MessageFlags.Ephemeral,
                    embeds: [createEmbed("success", `⏹️ **|** ${__("requestChannel.stopped")}`)],
                });
                setTimeout(async () => {
                    try {
                        await interaction.deleteReply();
                    } catch {
                        // Ignore errors
                    }
                }, 60_000);
                break;
            }

            case "RC_LOOP": {
                if (!queue || queue.songs.size === 0) {
                    await interaction.reply({
                        flags: MessageFlags.Ephemeral,
                        embeds: [createEmbed("warn", __("requestChannel.nothingPlaying"))],
                    });
                    return;
                }

                const modes: LoopMode[] = ["OFF", "SONG", "QUEUE"];
                const currentIndex = modes.indexOf(queue.loopMode);
                const nextMode = modes[(currentIndex + 1) % modes.length];
                queue.setLoopMode(nextMode);

                await interaction.reply({
                    flags: MessageFlags.Ephemeral,
                    embeds: [
                        createEmbed(
                            "success",
                            `🔁 **|** ${__mf("requestChannel.loopChanged", { mode: nextMode })}`,
                        ),
                    ],
                });
                setTimeout(async () => {
                    try {
                        await interaction.deleteReply();
                    } catch {
                        // Ignore errors
                    }
                }, 60_000);
                break;
            }

            case "RC_SHUFFLE": {
                if (!queue || queue.songs.size === 0) {
                    await interaction.reply({
                        flags: MessageFlags.Ephemeral,
                        embeds: [createEmbed("warn", __("requestChannel.nothingPlaying"))],
                    });
                    return;
                }

                queue.setShuffle(!queue.shuffle);
                await interaction.reply({
                    flags: MessageFlags.Ephemeral,
                    embeds: [
                        createEmbed(
                            "success",
                            `🔀 **|** ${__mf("requestChannel.shuffleChanged", { state: queue.shuffle ? "ON" : "OFF" })}`,
                        ),
                    ],
                });
                setTimeout(async () => {
                    try {
                        await interaction.deleteReply();
                    } catch {
                        // Ignore errors
                    }
                }, 60_000);
                break;
            }

            case "RC_VOL_DOWN": {
                if (!queue || queue.songs.size === 0) {
                    await interaction.reply({
                        flags: MessageFlags.Ephemeral,
                        embeds: [createEmbed("warn", __("requestChannel.nothingPlaying"))],
                    });
                    return;
                }

                const newVolDown = Math.max(1, queue.volume - 10);
                queue.volume = newVolDown;
                await interaction.reply({
                    flags: MessageFlags.Ephemeral,
                    embeds: [
                        createEmbed(
                            "success",
                            `🔊 **|** ${__mf("requestChannel.volumeChanged", { volume: newVolDown })}`,
                        ),
                    ],
                });
                setTimeout(async () => {
                    try {
                        await interaction.deleteReply();
                    } catch {
                        // Ignore errors
                    }
                }, 60_000);
                break;
            }

            case "RC_VOL_UP": {
                if (!queue || queue.songs.size === 0) {
                    await interaction.reply({
                        flags: MessageFlags.Ephemeral,
                        embeds: [createEmbed("warn", __("requestChannel.nothingPlaying"))],
                    });
                    return;
                }

                const newVolUp = queue.volume + 10;
                queue.volume = newVolUp;
                await interaction.reply({
                    flags: MessageFlags.Ephemeral,
                    embeds: [
                        createEmbed(
                            "success",
                            `🔊 **|** ${__mf("requestChannel.volumeChanged", { volume: newVolUp })}`,
                        ),
                    ],
                });
                setTimeout(async () => {
                    try {
                        await interaction.deleteReply();
                    } catch {
                        // Ignore errors
                    }
                }, 60_000);
                break;
            }

            case "RC_REMOVE": {
                if (!queue || queue.songs.size === 0) {
                    await interaction.reply({
                        flags: MessageFlags.Ephemeral,
                        embeds: [createEmbed("warn", __("requestChannel.nothingPlaying"))],
                    });
                    return;
                }

                if (!queue.canSkip()) {
                    await interaction.reply({
                        flags: MessageFlags.Ephemeral,
                        embeds: [createEmbed("warn", __("requestChannel.skipInProgress"))],
                    });
                    return;
                }

                const currentSong = (
                    queue.player.state as
                        | (AudioPlayerPlayingState & { resource?: { metadata?: QueueSong } })
                        | undefined
                )?.resource?.metadata;

                if (!currentSong) {
                    await interaction.reply({
                        flags: MessageFlags.Ephemeral,
                        embeds: [createEmbed("warn", __("requestChannel.nothingPlaying"))],
                    });
                    return;
                }

                const { hasPermission: hasRemovePermission } = await this.checkMusicPermission(
                    interaction,
                    member,
                    currentSong,
                );

                if (!hasRemovePermission) {
                    await interaction.reply({
                        flags: MessageFlags.Ephemeral,
                        embeds: [createEmbed("error", __("requestChannel.noPermission"), true)],
                    });
                    return;
                }

                if (!queue.startSkip()) {
                    await interaction.reply({
                        flags: MessageFlags.Ephemeral,
                        embeds: [createEmbed("warn", __("requestChannel.skipInProgress"))],
                    });
                    return;
                }

                const songTitle = currentSong.song.title;
                const songUrl = currentSong.song.url;
                const songThumbnail = currentSong.song.thumbnail;

                queue.songs.delete(currentSong.key);

                if (!queue.playing) {
                    queue.playing = true;
                }
                queue.player.stop(true);

                const removeEmbed = createEmbed(
                    "success",
                    `🗑️ **|** ${__mf("requestChannel.removed", { song: `**[${songTitle}](${songUrl})**` })}`,
                );
                if (songThumbnail) {
                    removeEmbed.setThumbnail(songThumbnail);
                }

                await interaction.reply({
                    flags: MessageFlags.Ephemeral,
                    embeds: [removeEmbed],
                });
                setTimeout(async () => {
                    try {
                        await interaction.deleteReply();
                    } catch {
                        // Ignore errors
                    }
                }, 60_000);
                break;
            }

            case "RC_QUEUE_LIST": {
                if (!queue || queue.songs.size === 0) {
                    await interaction.reply({
                        flags: MessageFlags.Ephemeral,
                        embeds: [createEmbed("warn", __("requestChannel.nothingPlaying"))],
                    });
                    return;
                }

                const np = (queue.player.state as AudioPlayerPlayingState).resource
                    .metadata as QueueSong;
                const full = queue.songs.sortByIndex() as unknown as SongManager;
                const songs =
                    queue.loopMode === "QUEUE" ? full : full.filter((val) => val.index >= np.index);
                const pages = chunk([...songs.values()], 10).map((sngs, ind) => {
                    const names = sngs.map((song, i) => {
                        const npKey = np.key;
                        const addition = song.key === npKey ? "**" : "";

                        return `${addition}${ind * 10 + (i + 1)} - [${song.song.title}](${song.song.url})${addition}`;
                    });

                    return names.join("\n");
                });

                let currentPage = 0;
                const embed = createEmbed(
                    "info",
                    pages[0] ?? `📋 **|** ${__("requestChannel.emptyQueue")}`,
                )
                    .setTitle(`📋 ${__("requestChannel.queueListTitle")}`)
                    .setThumbnail(guild.iconURL({ extension: "png", size: 1_024 }) ?? null)
                    .setFooter({
                        text: `• ${__mf("reusable.pageFooter", {
                            actual: 1,
                            total: pages.length || 1,
                        })}`,
                    });

                const createPaginationButtons = (
                    totalPages: number,
                ): ActionRowBuilder<ButtonBuilder>[] => {
                    if (totalPages <= 1) {
                        return [];
                    }

                    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
                        new ButtonBuilder()
                            .setCustomId("RCQ_PREV10")
                            .setEmoji("⏪")
                            .setStyle(ButtonStyle.Secondary),
                        new ButtonBuilder()
                            .setCustomId("RCQ_PREV")
                            .setEmoji("⬅️")
                            .setStyle(ButtonStyle.Primary),
                        new ButtonBuilder()
                            .setCustomId("RCQ_NEXT")
                            .setEmoji("➡️")
                            .setStyle(ButtonStyle.Primary),
                        new ButtonBuilder()
                            .setCustomId("RCQ_NEXT10")
                            .setEmoji("⏩")
                            .setStyle(ButtonStyle.Secondary),
                    );
                    return [row];
                };

                await interaction.reply({
                    flags: MessageFlags.Ephemeral,
                    embeds: [embed],
                    components: createPaginationButtons(pages.length),
                });

                if (pages.length > 1) {
                    const message = await interaction.fetchReply();
                    const collector = message.createMessageComponentCollector({
                        componentType: ComponentType.Button,
                        filter: (i) =>
                            i.user.id === interaction.user.id && i.customId.startsWith("RCQ_"),
                        time: 120_000,
                    });

                    collector.on("collect", async (i) => {
                        switch (i.customId) {
                            case "RCQ_PREV10":
                                currentPage -= 10;
                                break;
                            case "RCQ_PREV":
                                currentPage--;
                                break;
                            case "RCQ_NEXT":
                                currentPage++;
                                break;
                            case "RCQ_NEXT10":
                                currentPage += 10;
                                break;
                            default:
                                return;
                        }

                        currentPage = ((currentPage % pages.length) + pages.length) % pages.length;

                        embed.setDescription(pages[currentPage]).setFooter({
                            text: `• ${__mf("reusable.pageFooter", {
                                actual: currentPage + 1,
                                total: pages.length,
                            })}`,
                        });

                        await i.update({
                            embeds: [embed],
                            components: createPaginationButtons(pages.length),
                        });
                    });

                    collector.on("end", async () => {
                        try {
                            await interaction.editReply({
                                embeds: [embed],
                                components: [],
                            });
                        } catch {
                            // Ignore errors
                        }
                    });
                }
                break;
            }

            default:
                break;
        }

        await this.client.requestChannelManager.updatePlayerMessage(guild);
    }

    private async checkMusicPermission(
        interaction: ButtonInteraction,
        member: GuildMember | undefined,
        currentSong: QueueSong | undefined,
    ): Promise<{ hasPermission: boolean; djRole: { id: string } | null }> {
        const guild = interaction.guild;
        if (!guild || !member) {
            return { hasPermission: false, djRole: null };
        }

        const djRole = await this.client.utils.fetchDJRole(guild).catch(() => null);

        const hasPermission =
            member.roles.cache.has(djRole?.id ?? "") ||
            member.permissions.has("ManageGuild") ||
            currentSong?.requester.id === member.id;

        return { hasPermission, djRole };
    }

    private async handleSkipVoting(
        interaction: ButtonInteraction,
        queue: ServerQueue,
        member: GuildMember,
    ): Promise<boolean> {
        const guild = interaction.guild;
        if (!guild) {
            return false;
        }

        const __mf = i18n__mf(this.client, guild);

        const required = this.client.utils.requiredVoters(
            guild.members.me?.voice.channel?.members.size ?? 0,
        );

        // Toggle vote
        if (queue.skipVoters.includes(member.id)) {
            queue.skipVoters = queue.skipVoters.filter(
                (x) => x !== member.id,
            ) as unknown as string[];
            await interaction.reply({
                flags: MessageFlags.Ephemeral,
                embeds: [
                    createEmbed(
                        "info",
                        __mf("commands.music.skip.voteResultMessage", {
                            length: queue.skipVoters.length,
                            required,
                        }),
                    ),
                ],
            });
            return false;
        }

        queue.skipVoters.push(member.id);
        const length = queue.skipVoters.length;

        await interaction.reply({
            flags: MessageFlags.Ephemeral,
            embeds: [
                createEmbed(
                    "info",
                    __mf("commands.music.skip.voteResultMessage", { length, required }),
                ),
            ],
        });

        return length >= required;
    }

    private async handleLyricsButton(
        interaction: ButtonInteraction,
        queue: ServerQueue | undefined,
    ): Promise<void> {
        const guild = interaction.guild;
        const __ = i18n__(this.client, guild);
        const __mf = i18n__mf(this.client, guild);

        if (!queue || queue.songs.size === 0) {
            await interaction.reply({
                flags: MessageFlags.Ephemeral,
                embeds: [createEmbed("warn", __("requestChannel.nothingPlaying"))],
            });
            return;
        }

        const currentSong = (
            queue.player.state as
                | (AudioPlayerPlayingState & { resource?: { metadata?: QueueSong } })
                | undefined
        )?.resource?.metadata;

        if (!currentSong) {
            await interaction.reply({
                flags: MessageFlags.Ephemeral,
                embeds: [createEmbed("warn", __("requestChannel.nothingPlaying"))],
            });
            return;
        }

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const lyricsCommand = this.client.commands.get("lyrics");
        if (lyricsCommand && "fetchLyricsData" in lyricsCommand) {
            try {
                const data = await (
                    lyricsCommand as {
                        fetchLyricsData: (song: string) => Promise<LyricsAPIResult<false> | null>;
                    }
                ).fetchLyricsData(currentSong.song.title);

                if (
                    data === null ||
                    (data as { error: boolean }).error ||
                    (data.lyrics?.length ?? 0) === 0
                ) {
                    await interaction.editReply({
                        embeds: [
                            createEmbed(
                                "warn",
                                __mf("commands.music.lyrics.noLyrics", {
                                    song: `**${currentSong.song.title}**`,
                                }),
                            ),
                        ],
                    });
                    return;
                }

                const albumArt = data.album_art ?? "https://cdn.stegripe.org/images/icon.png";
                const pages: string[] = chunk(data.lyrics ?? "", 2_048);
                let currentPage = 0;
                const embed = createEmbed("info", pages[0])
                    .setAuthor({
                        name:
                            (data.song?.length ?? 0) > 0 && (data.artist?.length ?? 0) > 0
                                ? `${data.song} - ${data.artist}`
                                : currentSong.song.title.toUpperCase(),
                    })
                    .setThumbnail(albumArt);

                const createPaginationButtons = (totalPages: number) => {
                    if (totalPages < 2) {
                        return [];
                    }

                    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
                        new ButtonBuilder()
                            .setCustomId("LYRICS_PREV10")
                            .setEmoji("⏪")
                            .setStyle(ButtonStyle.Secondary),
                        new ButtonBuilder()
                            .setCustomId("LYRICS_PREV")
                            .setEmoji("⬅️")
                            .setStyle(ButtonStyle.Primary),
                        new ButtonBuilder()
                            .setCustomId("LYRICS_NEXT")
                            .setEmoji("➡️")
                            .setStyle(ButtonStyle.Primary),
                        new ButtonBuilder()
                            .setCustomId("LYRICS_NEXT10")
                            .setEmoji("⏩")
                            .setStyle(ButtonStyle.Secondary),
                    );
                    return [row];
                };

                embed.setFooter({
                    text: `• ${__mf("reusable.pageFooter", {
                        actual: 1,
                        total: pages.length,
                    })}. ${__mf("reusable.lyricsSource", { source: "lrclib" })}`,
                });

                await interaction.editReply({
                    embeds: [embed],
                    components: createPaginationButtons(pages.length),
                });

                if (pages.length > 1) {
                    const message = await interaction.fetchReply();
                    const collector = message.createMessageComponentCollector({
                        componentType: ComponentType.Button,
                        filter: (i) =>
                            i.user.id === interaction.user.id && i.customId.startsWith("LYRICS_"),
                        time: 120_000,
                    });

                    collector.on("collect", async (i) => {
                        switch (i.customId) {
                            case "LYRICS_PREV10":
                                currentPage -= 10;
                                break;
                            case "LYRICS_PREV":
                                currentPage--;
                                break;
                            case "LYRICS_NEXT":
                                currentPage++;
                                break;
                            case "LYRICS_NEXT10":
                                currentPage += 10;
                                break;
                            default:
                                return;
                        }

                        currentPage = ((currentPage % pages.length) + pages.length) % pages.length;

                        embed.setDescription(pages[currentPage]).setFooter({
                            text: `• ${__mf("reusable.pageFooter", {
                                actual: currentPage + 1,
                                total: pages.length,
                            })}. ${__mf("reusable.lyricsSource", { source: "lrclib" })}`,
                        });

                        await i.update({
                            embeds: [embed],
                            components: createPaginationButtons(pages.length),
                        });
                    });

                    collector.on("end", async () => {
                        try {
                            await interaction.editReply({
                                embeds: [embed],
                                components: [],
                            });
                        } catch {
                            // Ignore errors
                        }
                    });
                }
            } catch {
                await interaction.editReply({
                    embeds: [
                        createEmbed(
                            "error",
                            __mf("commands.music.lyrics.noLyrics", {
                                song: `**${currentSong.song.title}**`,
                            }),
                            true,
                        ),
                    ],
                });
            }
        } else {
            await interaction.editReply({
                embeds: [createEmbed("error", "Lyrics command not found.", true)],
            });
        }
    }
}
