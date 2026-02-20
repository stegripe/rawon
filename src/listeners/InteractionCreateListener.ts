import { setTimeout } from "node:timers";
import { type AudioPlayerPlayingState } from "@discordjs/voice";
import { ApplyOptions } from "@sapphire/decorators";
import { type Command, Events, Listener, type ListenerOptions } from "@sapphire/framework";
import {
    ActionRowBuilder,
    ApplicationCommandType,
    type BitFieldResolvable,
    ButtonBuilder,
    type ButtonInteraction,
    ButtonStyle,
    Collection,
    ComponentType,
    escapeMarkdown,
    GuildMember,
    type Interaction,
    Message,
    MessageFlags,
    PermissionsBitField,
    type PermissionsString,
    type Snowflake,
    type TextChannel,
} from "discord.js";
import { CommandContext } from "../structures/CommandContext.js";
import { type Rawon } from "../structures/Rawon.js";
import { type ServerQueue } from "../structures/ServerQueue.js";
import { type LoopMode, type LyricsAPIResult, type QueueSong } from "../typings/index.js";
import { chunk } from "../utils/functions/chunk.js";
import { createEmbed } from "../utils/functions/createEmbed.js";
import { i18n__, i18n__mf } from "../utils/functions/i18n.js";
import { parseHTMLElements } from "../utils/functions/parseHTMLElements.js";

function hasSlashCommand(cmd: Command): boolean {
    return cmd.options.chatInputCommand !== undefined;
}

function getCommandOptions(cmd: Command): Command.Options {
    return cmd.options;
}

import { type SongManager } from "../utils/structures/SongManager.js";

@ApplyOptions<ListenerOptions>({
    event: Events.InteractionCreate,
})
export class InteractionCreateListener extends Listener<typeof Events.InteractionCreate> {
    private readonly cooldowns = new Collection<string, Collection<Snowflake, number>>();
    private readonly processedInteractions = new Map<string, number>();
    private readonly CACHE_TTL = 10000;

    private cleanupCache(): void {
        const now = Date.now();
        for (const [key, timestamp] of this.processedInteractions) {
            if (now - timestamp > this.CACHE_TTL) {
                this.processedInteractions.delete(key);
            }
        }
    }

    public async run(interaction: Interaction): Promise<void> {
        const client = interaction.client as Rawon;

        const cacheKey = `${interaction.id}:${client.user?.id}`;
        if (this.processedInteractions.has(cacheKey)) {
            return;
        }
        this.processedInteractions.set(cacheKey, Date.now());

        if (this.processedInteractions.size > 100) {
            this.cleanupCache();
        }

        this.container.debugLog.logData("info", "INTERACTION_CREATE", [
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

        if (!interaction.inGuild() || !client.commands.isReady) {
            return;
        }

        if (interaction.guild) {
            const thisBotGuild = client.guilds.cache.get(interaction.guild.id);
            if (!thisBotGuild) {
                return;
            }

            let isMusicCommand = false;
            let commandName = "";

            if (interaction.isChatInputCommand()) {
                commandName = interaction.commandName;
                const cmd = client.commands
                    .filter((x: Command) => hasSlashCommand(x))
                    .find((x: Command) => x.name === commandName);

                const musicCommands = [
                    "volume",
                    "vol",
                    "loop",
                    "repeat",
                    "shuffle",
                    "filter",
                    "skip",
                    "skipto",
                    "pause",
                    "resume",
                    "stop",
                    "disconnect",
                    "dc",
                    "remove",
                    "seek",
                ];
                isMusicCommand =
                    cmd !== undefined &&
                    (musicCommands.includes(commandName) ||
                        (cmd.aliases.length > 0 &&
                            musicCommands.some((name) => cmd.aliases.includes(name))));
            }

            if (isMusicCommand) {
                let member = thisBotGuild.members.cache.get(interaction.user.id);
                if (!member) {
                    try {
                        const fetchedMember = await thisBotGuild.members
                            .fetch(interaction.user.id)
                            .catch(() => null);
                        if (fetchedMember) {
                            member = fetchedMember;
                        }
                    } catch {
                        if (
                            interaction.member &&
                            interaction.member instanceof GuildMember &&
                            interaction.member.guild.id === thisBotGuild.id
                        ) {
                            member = interaction.member;
                        }
                    }
                }
                if (
                    !member &&
                    interaction.member &&
                    interaction.member instanceof GuildMember &&
                    interaction.member.guild.id === thisBotGuild.id
                ) {
                    member = interaction.member;
                }

                const userVoiceChannelId = member?.voice.channelId ?? null;

                this.container.logger.debug(
                    `[MultiBot] ${client.user?.tag} PRE-CHECK music interaction "${commandName}" from ${interaction.user.tag}: ` +
                        `userVoiceChannel=${userVoiceChannelId ?? "none"}`,
                );

                if (userVoiceChannelId) {
                    const shouldRespond = client.multiBotManager.shouldRespondToMusicCommand(
                        client,
                        thisBotGuild,
                        userVoiceChannelId,
                    );

                    this.container.logger.debug(
                        `[MultiBot] ${client.user?.tag} PRE-CHECK result for music interaction "${commandName}": shouldRespond=${shouldRespond}`,
                    );

                    if (!shouldRespond) {
                        this.container.logger.warn(
                            `[MultiBot] ${client.user?.tag} ❌ BLOCKING music interaction "${commandName}" from ${interaction.user.tag} ` +
                                `- NOT in same voice channel (user in: ${userVoiceChannelId}). RETURNING EARLY - INTERACTION WILL NOT BE EXECUTED!`,
                        );
                        return;
                    }

                    this.container.logger.debug(
                        `[MultiBot] ${client.user?.tag} ✅ ALLOWING music interaction "${commandName}" - will proceed to command handler`,
                    );
                } else if (!client.multiBotManager.shouldRespond(client, thisBotGuild)) {
                    this.container.logger.debug(
                        `[MultiBot] ${client.user?.tag} skipping music interaction "${commandName}" - user not in voice and not responsible bot`,
                    );
                    return;
                }
            } else if (interaction.isChatInputCommand()) {
                commandName = interaction.commandName;
                if (!client.multiBotManager.shouldRespond(client, thisBotGuild)) {
                    this.container.logger.debug(
                        `[MultiBot] ${client.user?.tag} skipping interaction "${commandName}" - not responsible bot`,
                    );
                    return;
                }
            } else if (!client.multiBotManager.shouldRespond(client, thisBotGuild)) {
                this.container.logger.debug(
                    `[MultiBot] ${client.user?.tag} skipping interaction - not responsible bot`,
                );
                return;
            }
        }

        const thisBotGuildForContext = interaction.guild
            ? (client.guilds.cache.get(interaction.guild.id) ?? interaction.guild)
            : interaction.guild;

        const __mf = i18n__mf(client, thisBotGuildForContext);

        if (interaction.isButton()) {
            if (interaction.customId.startsWith("RC_")) {
                await this.handleRequestChannelButton(interaction);
                return;
            }

            const val = this.container.utils.decode(interaction.customId);
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

        if (
            interaction.guild &&
            thisBotGuildForContext &&
            thisBotGuildForContext !== interaction.guild
        ) {
            Object.defineProperty(context, "guild", {
                value: thisBotGuildForContext,
                writable: false,
                enumerable: true,
                configurable: true,
            });
            this.container.logger.debug(
                `[MultiBot] ${client.user?.tag} overrode context.guild with thisBotGuild for interaction`,
            );
        }

        if (interaction.isUserContextMenuCommand()) {
            const data =
                interaction.options.getUser("user") ?? interaction.options.get("message")?.message;
            let dataType = ApplicationCommandType.User;

            if (data instanceof Message) {
                dataType = ApplicationCommandType.Message;
            }

            const cmd = client.commands.find((x: Command) =>
                dataType === ApplicationCommandType.Message
                    ? getCommandOptions(x).contextChat === interaction.commandName
                    : getCommandOptions(x).contextUser === interaction.commandName,
            );
            if (cmd) {
                const isDeveloper = this.container.config.devs.includes(interaction.user.id);
                if (getCommandOptions(cmd).devOnly === true && !isDeveloper) {
                    try {
                        await interaction.reply({
                            flags: MessageFlags.Ephemeral,
                            embeds: [
                                createEmbed(
                                    "error",
                                    __mf("events.createInteraction.devOnly"),
                                    true,
                                ),
                            ],
                        });
                    } catch {
                        // Ignore errors
                    }
                    this.container.logger.warn(
                        `[MultiBot] ${client.user?.tag} ❌ BLOCKED non-dev ${interaction.user.tag} [${interaction.user.id}] from using dev-only context/menu ${interaction.commandName}`,
                    );
                    return;
                }
                context.additionalArgs.set("options", data);
                const ctxCmd = cmd as { contextRun?: (ctx: CommandContext) => Promise<unknown> };
                void ctxCmd.contextRun?.(context);
            }
        }

        if (interaction.isCommand()) {
            const cmd = client.commands
                .filter((x: Command) => hasSlashCommand(x))
                .find((x: Command) => x.name === interaction.commandName);
            if (cmd) {
                if (!this.cooldowns.has(cmd.name)) {
                    this.cooldowns.set(cmd.name, new Collection());
                }

                const now = Date.now();
                const timestamps = this.cooldowns.get(cmd.name);
                const cooldownAmount = (getCommandOptions(cmd).cooldown ?? 3) * 1_000;
                const isDeveloper = this.container.config.devs.includes(interaction.user.id);

                if (!isDeveloper) {
                    if (timestamps?.has(interaction.user.id) === true) {
                        const expirationTime =
                            (timestamps.get(interaction.user.id) as unknown as number) +
                            cooldownAmount;
                        if (now < expirationTime) {
                            const timeLeft = (expirationTime - now) / 1_000;
                            await interaction.reply({
                                flags: MessageFlags.Ephemeral,
                                embeds: [
                                    createEmbed(
                                        "warn",
                                        `⚠️ **|** ${__mf("utils.cooldownMessage", {
                                            author: interaction.user.toString(),
                                            timeleft: `**\`${timeLeft.toFixed(1)}\`**`,
                                        })}`,
                                    ),
                                ],
                            });
                            return;
                        }

                        timestamps.set(interaction.user.id, now);
                        setTimeout(() => timestamps?.delete(interaction.user.id), cooldownAmount);
                    } else {
                        timestamps?.set(interaction.user.id, now);
                        setTimeout(() => timestamps?.delete(interaction.user.id), cooldownAmount);
                    }
                }

                if (getCommandOptions(cmd).devOnly === true && !isDeveloper) {
                    try {
                        await interaction.reply({
                            flags: MessageFlags.Ephemeral,
                            embeds: [
                                createEmbed(
                                    "error",
                                    __mf("events.createInteraction.devOnly"),
                                    true,
                                ),
                            ],
                        });
                    } catch {
                        // Ignore errors
                    }
                    this.container.logger.warn(
                        `[MultiBot] ${client.user?.tag} ❌ BLOCKED non-dev ${interaction.user.tag} [${interaction.user.id}] from using dev-only slash ${interaction.commandName}`,
                    );
                    return;
                }

                this.container.logger.debug(
                    `[MultiBot] ${client.user?.tag} ✅ EXECUTING slash command "${interaction.commandName}" from ${interaction.user.tag}`,
                );
                this.container.logger.debug(
                    `${interaction.user.tag} [${interaction.user.id}] used /${interaction.commandName} ` +
                        `in #${(interaction.channel as TextChannel)?.name ?? "unknown"} [${interaction.channelId}] ` +
                        `in guild: ${thisBotGuildForContext?.name ?? interaction.guild?.name} [${interaction.guildId}]`,
                );
                const ctxCmd2 = cmd as { contextRun?: (ctx: CommandContext) => Promise<unknown> };
                void ctxCmd2.contextRun?.(context);
            } else {
                this.container.logger.warn(
                    `[MultiBot] ${client.user?.tag} command not found for interaction "${interaction.commandName}"`,
                );
            }
        }

        if (interaction.isStringSelectMenu()) {
            const val = this.container.utils.decode(interaction.customId);
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
                const command = client.commands
                    .filter((x: Command) => hasSlashCommand(x))
                    .find((x: Command) => x.name === cmd);
                if (command) {
                    const isDeveloper = this.container.config.devs.includes(interaction.user.id);
                    if (getCommandOptions(command).devOnly === true && !isDeveloper) {
                        try {
                            await interaction.reply({
                                flags: MessageFlags.Ephemeral,
                                embeds: [
                                    createEmbed(
                                        "error",
                                        __mf("events.createInteraction.devOnly"),
                                        true,
                                    ),
                                ],
                            });
                        } catch {
                            // Ignore errors
                        }
                        this.container.logger.warn(
                            `[MultiBot] ${client.user?.tag} ❌ BLOCKED non-dev ${interaction.user.tag} [${interaction.user.id}] from using dev-only select ${interaction.customId}`,
                        );
                        return;
                    }
                    context.additionalArgs.set("values", interaction.values);
                    const ctxCmd3 = command as {
                        contextRun?: (ctx: CommandContext) => Promise<unknown>;
                    };
                    void ctxCmd3.contextRun?.(context);
                }
            }
        }
    }

    private async handleRequestChannelButton(interaction: ButtonInteraction): Promise<void> {
        const client = interaction.client as Rawon;
        const guild = interaction.guild;
        if (!guild) {
            return;
        }

        const thisBotGuild = client.guilds.cache.get(guild.id);
        if (!thisBotGuild) {
            return;
        }

        if (this.container.config.isMultiBot) {
            const botId = client.user?.id ?? "unknown";
            let ownsRequestChannel = false;

            if (
                "getRequestChannel" in this.container.data &&
                typeof this.container.data.getRequestChannel === "function"
            ) {
                const requestChannelData = (this.container.data as any).getRequestChannel(
                    thisBotGuild.id,
                    botId,
                );
                ownsRequestChannel = requestChannelData?.channelId === interaction.channelId;
            } else {
                const data = this.container.data.data?.[thisBotGuild.id]?.requestChannel;
                ownsRequestChannel = data?.channelId === interaction.channelId;
            }

            if (ownsRequestChannel) {
                this.container.logger.debug(
                    `[MultiBot] ${client.user?.tag} ✅ responding to button "${interaction.customId}" (owns request channel)`,
                );
            } else {
                const primaryBot = client.multiBotManager.getPrimaryBot();
                if (primaryBot) {
                    const primaryBotGuild = primaryBot.guilds.cache.get(thisBotGuild.id);
                    if (primaryBotGuild) {
                        const primaryBotId = primaryBot.user?.id ?? "unknown";
                        let primaryOwnsRequestChannel = false;

                        if (
                            "getRequestChannel" in primaryBot.data &&
                            typeof primaryBot.data.getRequestChannel === "function"
                        ) {
                            const requestChannelData = (primaryBot.data as any).getRequestChannel(
                                thisBotGuild.id,
                                primaryBotId,
                            );
                            primaryOwnsRequestChannel =
                                requestChannelData?.channelId === interaction.channelId;
                        } else {
                            const data = primaryBot.data.data?.[thisBotGuild.id]?.requestChannel;
                            primaryOwnsRequestChannel = data?.channelId === interaction.channelId;
                        }

                        if (primaryOwnsRequestChannel && primaryBot !== client) {
                            this.container.logger.debug(
                                `[MultiBot] ${client.user?.tag} skipping button "${interaction.customId}" - primary bot owns request channel`,
                            );
                            try {
                                await interaction.deferUpdate();
                            } catch {
                                // Ignore errors
                            }
                            return;
                        }
                    }
                }

                this.container.logger.debug(
                    `[MultiBot] ${client.user?.tag} ✅ responding to button "${interaction.customId}" (owns request channel or no other bot owns it)`,
                );
            }
        }

        const __ = i18n__(client, thisBotGuild);
        const __mf = i18n__mf(client, thisBotGuild);

        this.container.logger.debug(
            `${interaction.user.tag} [${interaction.user.id}] clicked ${interaction.customId} button ` +
                `in guild: ${thisBotGuild.name} [${thisBotGuild.id}]`,
        );
        let member = thisBotGuild.members.cache.get(interaction.user.id);
        if (!member) {
            try {
                const fetchedMember = await thisBotGuild.members
                    .fetch(interaction.user.id)
                    .catch(() => null);
                if (fetchedMember) {
                    member = fetchedMember;
                }
            } catch {
                if (
                    interaction.member &&
                    interaction.member instanceof GuildMember &&
                    interaction.member.guild.id === thisBotGuild.id
                ) {
                    member = interaction.member;
                }
            }
        }
        if (
            !member &&
            interaction.member &&
            interaction.member instanceof GuildMember &&
            interaction.member.guild.id === thisBotGuild.id
        ) {
            member = interaction.member;
        }

        const voiceChannel = member?.voice.channel;

        let queue = thisBotGuild.queue;
        let queueGuild = thisBotGuild;

        if (this.container.config.isMultiBot && voiceChannel) {
            const responsibleBot = client.multiBotManager.getBotForVoiceChannel(
                thisBotGuild,
                voiceChannel.id,
            );
            if (responsibleBot && responsibleBot !== client) {
                const responsibleGuild = responsibleBot.guilds.cache.get(thisBotGuild.id);
                if (responsibleGuild?.queue) {
                    queue = responsibleGuild.queue;
                    queueGuild = responsibleGuild;
                    this.container.logger.debug(
                        `[MultiBot] ${client.user?.tag} (primary) using queue from ${responsibleBot.user?.tag} for voice channel ${voiceChannel.id}`,
                    );
                }
            }
        }

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
                        embeds: [
                            createEmbed(
                                "success",
                                `⏸️ **|** ${__("commands.music.pause.pauseMessage")}`,
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
                } else {
                    queue.playing = true;
                    await interaction.reply({
                        flags: MessageFlags.Ephemeral,
                        embeds: [
                            createEmbed(
                                "success",
                                `▶️ **|** ${__("commands.music.resume.resumeMessage")}`,
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
                    `⏭️ **|** ${__mf("commands.music.skip.skipMessage", {
                        song: skipSong ? `**[${skipSong.song.title}](${skipSong.song.url})**` : "",
                    })}`,
                ).setThumbnail(skipSong?.song.thumbnail ?? null);

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

                await queue.destroy();
                await interaction.reply({
                    flags: MessageFlags.Ephemeral,
                    embeds: [
                        createEmbed(
                            "success",
                            `⏹️ **|** ${__("commands.music.stop.stoppedMessage")}`,
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

            case "RC_LOOP": {
                if (!queue || queue.songs.size === 0) {
                    await interaction.reply({
                        flags: MessageFlags.Ephemeral,
                        embeds: [createEmbed("warn", __("requestChannel.nothingPlaying"))],
                    });
                    return;
                }

                const modes: LoopMode[] = ["OFF", "SONG", "QUEUE"];
                const modeEmoji: Record<LoopMode, string> = {
                    OFF: "▶️",
                    QUEUE: "🔁",
                    SONG: "🔂",
                };
                const currentIndex = modes.indexOf(queue.loopMode);
                const nextMode = modes[(currentIndex + 1) % modes.length];
                queue.setLoopMode(nextMode);

                await interaction.reply({
                    flags: MessageFlags.Ephemeral,
                    embeds: [
                        createEmbed(
                            "success",
                            `${modeEmoji[nextMode]} **|** ${__mf("commands.music.repeat.newMode", {
                                mode: `**\`${nextMode}\`**`,
                            })}`,
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
                const isShuffle = queue.shuffle;
                await interaction.reply({
                    flags: MessageFlags.Ephemeral,
                    embeds: [
                        createEmbed(
                            "success",
                            `${isShuffle ? "🔀" : "▶️"} **|** ${__mf(
                                "commands.music.shuffle.newState",
                                {
                                    state: `**\`${isShuffle ? __("reusable.enabled") : __("reusable.disabled")}\`**`,
                                },
                            )}`,
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
                            `🔊 **|** ${__mf("commands.music.volume.newVolume", {
                                volume: `**\`${newVolDown}%\`**`,
                            })}`,
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
                            `🔊 **|** ${__mf("commands.music.volume.newVolume", {
                                volume: `**\`${newVolUp}%\`**`,
                            })}`,
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

                const opening = __mf("commands.music.remove.songsRemoved", { removed: 1 });
                const pageContent = `${__("commands.music.remove.songSkip")}1.) **[${escapeMarkdown(parseHTMLElements(songTitle))}](${songUrl})**`;
                const removeEmbed = createEmbed("info", pageContent)
                    .setAuthor({ name: opening })
                    .setFooter({
                        text: `• ${__mf("reusable.pageFooter", { actual: 1, total: 1 })}`,
                    });
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

        if (this.container.config.isMultiBot && queue && queueGuild !== thisBotGuild) {
            const responsibleBot = queueGuild.client as Rawon;
            await responsibleBot.requestChannelManager.updatePlayerMessage(queueGuild);
        } else {
            await this.container.requestChannelManager.updatePlayerMessage(thisBotGuild);
        }
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

        const client = interaction.client as Rawon;
        const thisBotGuild = client.guilds.cache.get(guild.id) ?? guild;
        const djRole = await this.container.utils.fetchDJRole(thisBotGuild).catch(() => null);

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
        const client = interaction.client as Rawon;
        const guild = interaction.guild;
        if (!guild) {
            return false;
        }

        const thisBotGuild = client.guilds.cache.get(guild.id) ?? guild;
        const __mf = i18n__mf(client, thisBotGuild);

        const required = this.container.utils.requiredVoters(
            thisBotGuild.members.me?.voice.channel?.members.size ?? 0,
        );

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
        const client = interaction.client as Rawon;
        const guild = interaction.guild;
        const __ = i18n__(client, guild);
        const __mf = i18n__mf(client, guild);

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

        const lyricsCommand = client.commands.get("lyrics");
        if (lyricsCommand && "fetchLyricsData" in lyricsCommand) {
            try {
                const data = await (
                    lyricsCommand as {
                        fetchLyricsData: (
                            client: Rawon,
                            song: string,
                        ) => Promise<LyricsAPIResult<false> | null>;
                    }
                ).fetchLyricsData(client, currentSong.song.title);

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

                const albumArt =
                    currentSong.song.thumbnail ??
                    data.album_art ??
                    "https://cdn.stegripe.org/images/icon.png";
                const lyricsSource =
                    (data as LyricsAPIResult<false> & { source?: string }).source ?? "stegripe";
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
                    text: `• ${__mf("reusable.lyricsSource", { source: lyricsSource })}. ${__mf(
                        "reusable.pageFooter",
                        {
                            actual: 1,
                            total: pages.length,
                        },
                    )}`,
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
                            text: `• ${__mf("reusable.lyricsSource", { source: lyricsSource })}. ${__mf(
                                "reusable.pageFooter",
                                {
                                    actual: currentPage + 1,
                                    total: pages.length,
                                },
                            )}`,
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
                embeds: [
                    createEmbed(
                        "error",
                        __("events.createInteraction.lyricsCommandNotFound"),
                        true,
                    ),
                ],
            });
        }
    }
}
