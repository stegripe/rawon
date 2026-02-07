import path from "node:path";
import process from "node:process";
import { type Command, container, SapphireClient } from "@sapphire/framework";
import { PinoLogger } from "@stegripe/pino-logger";
import {
    type ClientOptions,
    Collection,
    type DMChannel,
    type Guild,
    type GuildChannel,
    type Interaction,
    type Message,
    type NonThreadGuildBasedChannel,
    type PartialMessage,
    type VoiceState,
} from "discord.js";
import got from "got";
import { Soundcloud } from "soundcloud.ts";
import * as config from "../config/index.js";
import { type GuildData } from "../typings/index.js";
import { SpotifyUtil } from "../utils/handlers/SpotifyUtil.js";
import { AudioCacheManager } from "../utils/structures/AudioCacheManager.js";
import { ClientUtils } from "../utils/structures/ClientUtils.js";
import { CookiesManager } from "../utils/structures/CookiesManager.js";
import { DebugLogManager } from "../utils/structures/DebugLogManager.js";
import { MultiBotManager } from "../utils/structures/MultiBotManager.js";
import { RequestChannelManager } from "../utils/structures/RequestChannelManager.js";
import { SQLiteDataManager } from "../utils/structures/SQLiteDataManager.js";
import { setCookiesManager } from "../utils/yt-dlp/index.js";
import { CommandContext } from "./CommandContext.js";

interface CompatibleCommand extends Command {
    meta: {
        name: string;
        description?: string;
        aliases?: readonly string[];
        cooldown?: number;
        devOnly?: boolean;
        contextChat?: string;
        contextUser?: string;
        disable?: boolean;
        usage?: string;
        slash?: boolean;
    };
}

interface CommandCategory {
    name: string;
    cmds: Collection<string, CompatibleCommand>;
    hide: boolean;
}

function wrapCommand(cmd: Command): CompatibleCommand {
    const opts = cmd.options as Command.Options & {
        devOnly?: boolean;
        cooldown?: number;
        contextChat?: string;
        contextUser?: string;
        disable?: boolean;
    };
    return Object.assign(cmd, {
        meta: {
            name: cmd.name,
            description: cmd.description,
            aliases: cmd.aliases as readonly string[],
            cooldown: opts.cooldown,
            devOnly: opts.devOnly,
            contextChat: opts.contextChat,
            contextUser: opts.contextUser,
            disable: opts.disable,
            usage:
                typeof cmd.detailedDescription === "object"
                    ? (cmd.detailedDescription as { usage?: string }).usage
                    : undefined,
            slash: opts.chatInputCommand !== undefined,
        },
    }) as CompatibleCommand;
}

class CommandsCompatibility {
    private readonly client: Rawon;
    public readonly aliases = new Collection<string, string>();

    public constructor(client: Rawon) {
        this.client = client;
    }

    public get isReady(): boolean {
        return this.client.isReady();
    }

    public get(name: string): CompatibleCommand | undefined {
        const store = this.client.stores.get("commands");
        container.logger.debug(
            `[CommandsCompat] get("${name}") - store has ${store.size} commands`,
        );
        let cmd = store.get(name);
        if (cmd) {
            return wrapCommand(cmd);
        }
        const aliasedName = this.aliases.get(name);
        if (aliasedName) {
            cmd = store.get(aliasedName);
            if (cmd) {
                return wrapCommand(cmd);
            }
        }
        cmd = [...store.values()].find((c) => {
            const aliases = (c.options as { aliases?: string[] }).aliases ?? [];
            return aliases.includes(name);
        });
        return cmd ? wrapCommand(cmd) : undefined;
    }

    public find(fn: (cmd: CompatibleCommand) => boolean): CompatibleCommand | undefined {
        const store = this.client.stores.get("commands");
        const wrapped = [...store.values()].map(wrapCommand);
        return wrapped.find(fn);
    }

    public filter(fn: (cmd: CompatibleCommand) => boolean): CompatibleCommand[] {
        const store = this.client.stores.get("commands");
        const wrapped = [...store.values()].map(wrapCommand);
        return wrapped.filter(fn);
    }

    public values(): IterableIterator<CompatibleCommand> {
        const store = this.client.stores.get("commands");
        return [...store.values()].map(wrapCommand)[Symbol.iterator]();
    }

    public [Symbol.iterator](): IterableIterator<CompatibleCommand> {
        return this.values();
    }

    public get categories(): Collection<string, CommandCategory> {
        const store = this.client.stores.get("commands");
        const categories = new Collection<string, CommandCategory>();

        for (const cmd of store.values()) {
            const category =
                cmd.fullCategory.length > 0 ? (cmd.fullCategory.at(-1) ?? "general") : "general";

            if (!categories.has(category)) {
                categories.set(category, {
                    name: category.charAt(0).toUpperCase() + category.slice(1),
                    cmds: new Collection(),
                    hide: category === "developers",
                });
            }

            const wrapped = wrapCommand(cmd);
            categories.get(category)!.cmds.set(cmd.name, wrapped);
        }

        return categories;
    }

    public handle(message: Message, prefix: string): void {
        const content = message.content.slice(prefix.length).trim();
        const args = content.split(/ +/u);
        const commandName = args.shift()?.toLowerCase();

        container.logger.debug(
            `[CommandsCompat] handle() called - prefix: "${prefix}", commandName: "${commandName}"`,
        );

        if (!commandName) {
            container.logger.debug("[CommandsCompat] No command name found");
            return;
        }

        const command = this.get(commandName);
        if (!command) {
            container.logger.debug(`[CommandsCompat] Command "${commandName}" not found`);
            return;
        }

        container.logger.debug(
            `[CommandsCompat] Found command: ${command.name}, meta.disable: ${command.meta.disable}`,
        );

        if (command.meta.disable) {
            container.logger.debug(`[CommandsCompat] Command "${commandName}" is disabled`);
            return;
        }

        const ctx = new CommandContext(message, args);

        const ctxCommand = command as unknown as {
            contextRun?: (ctx: CommandContext) => Promise<unknown>;
        };

        container.logger.debug(
            `[CommandsCompat] contextRun available: ${typeof ctxCommand.contextRun === "function"}`,
        );

        if (ctxCommand.contextRun) {
            container.logger.info(`[CommandsCompat] Executing command "${commandName}"`);
            void ctxCommand.contextRun(ctx);
        }
    }
}

export class Rawon extends SapphireClient {
    public startTimestamp = 0;
    public readonly config = config;
    public readonly data = new SQLiteDataManager<Record<string, GuildData>>(
        path.resolve(process.cwd(), "cache", "data.db"),
    );
    public readonly debugLog = new DebugLogManager(this.config.debugMode, this.config.isProd);
    public readonly spotify = new SpotifyUtil(this);
    public readonly utils = new ClientUtils(this);
    public readonly soundcloud = new Soundcloud();
    public readonly requestChannelManager = new RequestChannelManager(this);
    public readonly audioCache = new AudioCacheManager(this);
    public readonly cookies = new CookiesManager(this);
    public readonly multiBotManager = MultiBotManager.getInstance();
    public readonly commands = new CommandsCompatibility(this);
    public readonly request = got.extend({
        hooks: {
            beforeError: [
                (error) => {
                    this.debugLog.logData("error", "GOT_REQUEST", [
                        ["URL", error.options.url?.toString() ?? "[???]"],
                        ["Code", error.code],
                        ["Response", error.response?.rawBody.toString("ascii") ?? "[???]"],
                    ]);

                    return error;
                },
            ],
            beforeRequest: [
                (options) => {
                    this.debugLog.logData("info", "GOT_REQUEST", [
                        ["URL", options.url?.toString() ?? "[???]"],
                        ["Method", options.method],
                        ["Encoding", options.encoding ?? "UTF-8"],
                        ["Agent", options.agent.http ? "HTTP" : "HTTPS"],
                    ]);
                },
            ],
        },
    });

    public constructor(
        clientOptions: ClientOptions & {
            loadMessageCommandListeners?: boolean;
            defaultPrefix?: string;
            baseUserDirectory?: string;
        },
    ) {
        super({
            ...clientOptions,
            loadApplicationCommandRegistriesStatusListeners: !config.isMultiBot,
            loadDefaultErrorListeners: false,
            logger: {
                instance: new PinoLogger({
                    name: "rawon",
                    timestamp: true,
                    level: config.isProd ? "info" : "debug",
                    formatters: {
                        bindings: () => ({ pid: `Rawon@${process.pid}` }),
                    },
                }),
            },
        });

        container.config = config;
        container.data = this.data;
        container.debugLog = this.debugLog;
        container.spotify = this.spotify;
        container.utils = this.utils;
        container.soundcloud = this.soundcloud;
        container.requestChannelManager = this.requestChannelManager;
        container.audioCache = this.audioCache;
        container.cookies = this.cookies;
        container.request = this.request;
    }

    public build: (token?: string) => Promise<this> = async (token?: string) => {
        this.startTimestamp = Date.now();
        setCookiesManager(this.cookies);

        if (this.config.isMultiBot) {
            const listenerStore = this.stores.get("listeners");
            const coreReady = listenerStore.get("CoreReady");
            if (coreReady) {
                (coreReady as { run: () => void }).run = () => {
                    container.logger.debug(
                        "[MultiBot] Skipped CoreReady listener to prevent application command registration errors",
                    );
                };
            }
        }

        const loginToken = token ?? process.env.DISCORD_TOKEN;
        if (!loginToken) {
            throw new Error("No token provided for login");
        }

        await this.login(loginToken);

        if (this.config.isMultiBot) {
            container.logger.info(
                `[MultiBot] Bot ${this.user?.tag} is in ${this.guilds.cache.size} guild(s): ${Array.from(this.guilds.cache.keys()).join(", ")}`,
            );

            const listenerStore = this.stores.get("listeners");
            if (container.client !== this) {
                container.logger.info(
                    `[MultiBot] Bot ${this.user?.tag} is NOT container.client, setting up event forwarding...`,
                );

                this.on("messageCreate", (message: Message) => {
                    const listener = listenerStore.get("MessageCreateListener");
                    if (listener?.run) {
                        void (listener as { run: (m: Message) => Promise<void> }).run(message);
                    }
                });

                this.on("interactionCreate", (interaction: Interaction) => {
                    const listener = listenerStore.get("InteractionCreateListener");
                    if (listener?.run) {
                        void (listener as { run: (i: Interaction) => Promise<void> }).run(
                            interaction,
                        );
                    }
                });

                this.on("voiceStateUpdate", (oldState: VoiceState, newState: VoiceState) => {
                    const listener = listenerStore.get("VoiceStateUpdateListener");
                    if (listener?.run) {
                        void (
                            listener as {
                                run: (o: VoiceState, n: VoiceState) => Promise<Message | undefined>;
                            }
                        ).run(oldState, newState);
                    }
                });

                this.on("messageDelete", (message: Message | PartialMessage) => {
                    const listener = listenerStore.get("MessageDeleteListener");
                    if (listener?.run) {
                        void (
                            listener as { run: (m: Message | PartialMessage) => Promise<void> }
                        ).run(message);
                    }
                });

                this.on("guildDelete", (guild: Guild) => {
                    const listener = listenerStore.get("GuildDeleteListener");
                    if (listener?.run) {
                        void (listener as { run: (g: Guild) => Promise<void> }).run(guild);
                    }
                });

                this.on("channelDelete", (channel: DMChannel | GuildChannel) => {
                    const listener = listenerStore.get("ChannelDeleteListener");
                    if (listener?.run) {
                        void (
                            listener as { run: (c: DMChannel | GuildChannel) => Promise<void> }
                        ).run(channel);
                    }
                });

                this.on(
                    "channelUpdate",
                    (
                        oldChannel: DMChannel | NonThreadGuildBasedChannel,
                        newChannel: DMChannel | NonThreadGuildBasedChannel,
                    ) => {
                        const listener = listenerStore.get("ChannelUpdateListener");
                        if (listener?.run) {
                            void (
                                listener as {
                                    run: (
                                        o: DMChannel | NonThreadGuildBasedChannel,
                                        n: DMChannel | NonThreadGuildBasedChannel,
                                    ) => Promise<void>;
                                }
                            ).run(oldChannel, newChannel);
                        }
                    },
                );

                container.logger.info(
                    `[MultiBot] Event forwarding set up for bot ${this.user?.tag}`,
                );
            }
        }

        return this;
    };
}
