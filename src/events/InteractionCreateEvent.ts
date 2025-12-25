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
    type Interaction,
    Message,
    MessageFlags,
    PermissionsBitField,
    type PermissionsString,
    type TextChannel,
} from "discord.js";
import i18n from "../config/index.js";
import { BaseEvent } from "../structures/BaseEvent.js";
import { CommandContext } from "../structures/CommandContext.js";
import { type ServerQueue } from "../structures/ServerQueue.js";
import { type LoopMode, type LyricsAPIResult, type QueueSong } from "../typings/index.js";
import { Event } from "../utils/decorators/Event.js";
import { chunk } from "../utils/functions/chunk.js";
import { createEmbed } from "../utils/functions/createEmbed.js";
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
                                i18n.__mf("events.createInteraction.message1", {
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
                            i18n.__mf("events.createInteraction.message1", {
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

        this.client.logger.info(
            `${interaction.user.tag} [${interaction.user.id}] clicked ${interaction.customId} button ` +
                `in guild: ${guild.name} [${guild.id}]`,
        );

        const member = guild.members.cache.get(interaction.user.id);
        const voiceChannel = member?.voice.channel;
        const queue = guild.queue;

        // RC_LYRICS doesn't require voice channel - it just shows lyrics of current song
        if (interaction.customId === "RC_LYRICS") {
            await this.handleLyricsButton(interaction, queue);
            return;
        }

        if (!voiceChannel) {
            await interaction.reply({
                flags: MessageFlags.Ephemeral,
                embeds: [createEmbed("warn", i18n.__("requestChannel.notInVoice"))],
            });
            return;
        }

        const botVoiceChannel = guild.members.me?.voice.channel;
        if (botVoiceChannel && voiceChannel.id !== botVoiceChannel.id) {
            await interaction.reply({
                flags: MessageFlags.Ephemeral,
                embeds: [createEmbed("warn", i18n.__("utils.musicDecorator.sameVC"))],
            });
            return;
        }

        switch (interaction.customId) {
            case "RC_PAUSE_RESUME": {
                if (!queue || queue.songs.size === 0) {
                    await interaction.reply({
                        flags: MessageFlags.Ephemeral,
                        embeds: [createEmbed("warn", i18n.__("requestChannel.nothingPlaying"))],
                    });
                    return;
                }

                if (queue.playing) {
                    queue.playing = false;
                    await interaction.reply({
                        flags: MessageFlags.Ephemeral,
                        embeds: [
                            createEmbed("success", `⏸️ **|** ${i18n.__("requestChannel.paused")}`),
                        ],
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
                        embeds: [
                            createEmbed("success", `▶️ **|** ${i18n.__("requestChannel.resumed")}`),
                        ],
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
                        embeds: [createEmbed("warn", i18n.__("requestChannel.nothingPlaying"))],
                    });
                    return;
                }

                const skipSong = (
                    queue.player.state as
                        | (AudioPlayerPlayingState & { resource?: { metadata?: QueueSong } })
                        | undefined
                )?.resource?.metadata;

                if (!queue.playing) {
                    queue.playing = true;
                }
                queue.player.stop(true);

                const skipEmbed = createEmbed(
                    "success",
                    `⏭️ **|** ${i18n.__mf("requestChannel.skipped", { song: skipSong ? `[${skipSong.song.title}](${skipSong.song.url})` : "" })}`,
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
                        embeds: [createEmbed("warn", i18n.__("requestChannel.nothingPlaying"))],
                    });
                    return;
                }

                queue.destroy();
                await interaction.reply({
                    flags: MessageFlags.Ephemeral,
                    embeds: [
                        createEmbed("success", `⏹️ **|** ${i18n.__("requestChannel.stopped")}`),
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

            case "RC_LOOP": {
                if (!queue || queue.songs.size === 0) {
                    await interaction.reply({
                        flags: MessageFlags.Ephemeral,
                        embeds: [createEmbed("warn", i18n.__("requestChannel.nothingPlaying"))],
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
                            `🔁 **|** ${i18n.__mf("requestChannel.loopChanged", { mode: nextMode })}`,
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
                        embeds: [createEmbed("warn", i18n.__("requestChannel.nothingPlaying"))],
                    });
                    return;
                }

                queue.setShuffle(!queue.shuffle);
                await interaction.reply({
                    flags: MessageFlags.Ephemeral,
                    embeds: [
                        createEmbed(
                            "success",
                            `🔀 **|** ${i18n.__mf("requestChannel.shuffleChanged", { state: queue.shuffle ? "ON" : "OFF" })}`,
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
                        embeds: [createEmbed("warn", i18n.__("requestChannel.nothingPlaying"))],
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
                            `🔊 **|** ${i18n.__mf("requestChannel.volumeChanged", { volume: newVolDown })}`,
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
                        embeds: [createEmbed("warn", i18n.__("requestChannel.nothingPlaying"))],
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
                            `🔊 **|** ${i18n.__mf("requestChannel.volumeChanged", { volume: newVolUp })}`,
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
                        embeds: [createEmbed("warn", i18n.__("requestChannel.nothingPlaying"))],
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
                        embeds: [createEmbed("warn", i18n.__("requestChannel.nothingPlaying"))],
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
                    `🗑️ **|** ${i18n.__mf("requestChannel.removed", { song: `[${songTitle}](${songUrl})` })}`,
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
                        embeds: [createEmbed("warn", i18n.__("requestChannel.nothingPlaying"))],
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
                    pages[0] ?? `📋 **|** ${i18n.__("requestChannel.emptyQueue")}`,
                )
                    .setTitle(`📋 ${i18n.__("requestChannel.queueListTitle")}`)
                    .setThumbnail(guild.iconURL({ extension: "png", size: 1_024 }) ?? null)
                    .setFooter({
                        text: `• ${i18n.__mf("reusable.pageFooter", {
                            actual: 1,
                            total: pages.length || 1,
                        })}`,
                    });

                const createPaginationButtons = (
                    page: number,
                    totalPages: number,
                ): ActionRowBuilder<ButtonBuilder>[] => {
                    if (totalPages <= 1) {
                        return [];
                    }

                    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
                        new ButtonBuilder()
                            .setCustomId("RCQ_PREV10")
                            .setEmoji("⏪")
                            .setStyle(ButtonStyle.Secondary)
                            .setDisabled(page < 10),
                        new ButtonBuilder()
                            .setCustomId("RCQ_PREV")
                            .setEmoji("⬅️")
                            .setStyle(ButtonStyle.Primary)
                            .setDisabled(page === 0),
                        new ButtonBuilder()
                            .setCustomId("RCQ_NEXT")
                            .setEmoji("➡️")
                            .setStyle(ButtonStyle.Primary)
                            .setDisabled(page >= totalPages - 1),
                        new ButtonBuilder()
                            .setCustomId("RCQ_NEXT10")
                            .setEmoji("⏩")
                            .setStyle(ButtonStyle.Secondary)
                            .setDisabled(page >= totalPages - 10),
                    );
                    return [row];
                };

                await interaction.reply({
                    flags: MessageFlags.Ephemeral,
                    embeds: [embed],
                    components: createPaginationButtons(currentPage, pages.length),
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
                                currentPage = Math.max(0, currentPage - 10);
                                break;
                            case "RCQ_PREV":
                                currentPage = Math.max(0, currentPage - 1);
                                break;
                            case "RCQ_NEXT":
                                currentPage = Math.min(pages.length - 1, currentPage + 1);
                                break;
                            case "RCQ_NEXT10":
                                currentPage = Math.min(pages.length - 1, currentPage + 10);
                                break;
                            default:
                                return;
                        }

                        embed.setDescription(pages[currentPage]).setFooter({
                            text: `• ${i18n.__mf("reusable.pageFooter", {
                                actual: currentPage + 1,
                                total: pages.length,
                            })}`,
                        });

                        await i.update({
                            embeds: [embed],
                            components: createPaginationButtons(currentPage, pages.length),
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

    private async handleLyricsButton(
        interaction: ButtonInteraction,
        queue: ServerQueue | undefined,
    ): Promise<void> {
        if (!queue || queue.songs.size === 0) {
            await interaction.reply({
                flags: MessageFlags.Ephemeral,
                embeds: [createEmbed("warn", i18n.__("requestChannel.nothingPlaying"))],
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
                embeds: [createEmbed("warn", i18n.__("requestChannel.nothingPlaying"))],
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
                                i18n.__mf("commands.music.lyrics.noLyrics", {
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

                const createPaginationButtons = (page: number, totalPages: number) => {
                    if (totalPages < 2) {
                        return [];
                    }

                    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
                        new ButtonBuilder()
                            .setCustomId("LYRICS_PREV10")
                            .setEmoji("⏪")
                            .setStyle(ButtonStyle.Secondary)
                            .setDisabled(page < 10),
                        new ButtonBuilder()
                            .setCustomId("LYRICS_PREV")
                            .setEmoji("⬅️")
                            .setStyle(ButtonStyle.Primary)
                            .setDisabled(page === 0),
                        new ButtonBuilder()
                            .setCustomId("LYRICS_NEXT")
                            .setEmoji("➡️")
                            .setStyle(ButtonStyle.Primary)
                            .setDisabled(page >= totalPages - 1),
                        new ButtonBuilder()
                            .setCustomId("LYRICS_NEXT10")
                            .setEmoji("⏩")
                            .setStyle(ButtonStyle.Secondary)
                            .setDisabled(page >= totalPages - 10),
                    );
                    return [row];
                };

                if (pages.length > 1) {
                    embed.setFooter({
                        text: `• ${i18n.__mf("reusable.pageFooter", {
                            actual: 1,
                            total: pages.length,
                        })}`,
                    });
                }

                await interaction.editReply({
                    embeds: [embed],
                    components: createPaginationButtons(currentPage, pages.length),
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
                                currentPage = Math.max(0, currentPage - 10);
                                break;
                            case "LYRICS_PREV":
                                currentPage = Math.max(0, currentPage - 1);
                                break;
                            case "LYRICS_NEXT":
                                currentPage = Math.min(pages.length - 1, currentPage + 1);
                                break;
                            case "LYRICS_NEXT10":
                                currentPage = Math.min(pages.length - 1, currentPage + 10);
                                break;
                            default:
                                return;
                        }

                        embed.setDescription(pages[currentPage]).setFooter({
                            text: `• ${i18n.__mf("reusable.pageFooter", {
                                actual: currentPage + 1,
                                total: pages.length,
                            })}`,
                        });

                        await i.update({
                            embeds: [embed],
                            components: createPaginationButtons(currentPage, pages.length),
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
                            i18n.__mf("commands.music.lyrics.noLyrics", {
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
