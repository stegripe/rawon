import path from "node:path";
import process from "node:process";
import { Client, type ClientOptions } from "discord.js";
import got from "got";
import { Soundcloud } from "soundcloud.ts";
import * as config from "../config/index.js";
import { type GuildData } from "../typings/index.js";
import { importURLToString } from "../utils/functions/importURLToString.js";
import { SpotifyUtil } from "../utils/handlers/SpotifyUtil.js";
import { AudioCacheManager } from "../utils/structures/AudioCacheManager.js";
import { ClientUtils } from "../utils/structures/ClientUtils.js";
import { CommandManager } from "../utils/structures/CommandManager.js";
import { CookiesManager } from "../utils/structures/CookiesManager.js";
import { DebugLogManager } from "../utils/structures/DebugLogManager.js";
import { EventsLoader } from "../utils/structures/EventsLoader.js";
import { JSONDataManager } from "../utils/structures/JSONDataManager.js";
import { MultiBotManager } from "../utils/structures/MultiBotManager.js";
import { RawonLogger } from "../utils/structures/RawonLogger.js";
import { RequestChannelManager } from "../utils/structures/RequestChannelManager.js";
import { setCookiesManager } from "../utils/yt-dlp/index.js";

export interface RawonOptions {
    clientOptions: ClientOptions;
    botIndex?: number;
    token?: string;
}

export class Rawon extends Client {
    public startTimestamp = 0;
    public readonly config = config;
    public readonly botIndex: number;
    public readonly botToken: string | undefined;
    public readonly multiBotManager = MultiBotManager.getInstance();
    public readonly commands: CommandManager;
    public readonly events: EventsLoader;
    public readonly data: JSONDataManager<Record<string, GuildData>>;
    public readonly logger = new RawonLogger({ prod: config.isProd });
    public readonly debugLog = new DebugLogManager(config.debugMode, config.isProd);
    public readonly spotify: SpotifyUtil;
    public readonly utils: ClientUtils;
    public readonly soundcloud = new Soundcloud();
    public readonly requestChannelManager: RequestChannelManager;
    public readonly audioCache: AudioCacheManager;
    public readonly cookies: CookiesManager;
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

    public constructor(options: RawonOptions) {
        super(options.clientOptions);
        this.botIndex = options.botIndex ?? 0;
        this.botToken = options.token;
        this.commands = new CommandManager(
            this,
            path.resolve(importURLToString(import.meta.url), "..", "commands"),
        );
        this.events = new EventsLoader(
            this,
            path.resolve(importURLToString(import.meta.url), "..", "events"),
        );
        this.data = new JSONDataManager<Record<string, GuildData>>(
            path.resolve(process.cwd(), "cache", "data.json"),
        );
        this.spotify = new SpotifyUtil(this);
        this.utils = new ClientUtils(this);
        this.requestChannelManager = new RequestChannelManager(this);
        this.audioCache = new AudioCacheManager(this);
        this.cookies = new CookiesManager(this);
    }

    /**
     * Check if this bot is the primary bot (index 0)
     */
    public isPrimaryBot(): boolean {
        return this.botIndex === 0;
    }

    /**
     * Check if this bot should respond for a given guild.
     * In multi-bot mode, only the highest priority bot in the guild should respond.
     */
    public shouldRespondInGuild(guildId: string): boolean {
        if (!this.multiBotManager.isMultiBotActive()) {
            return true;
        }

        const guild = this.guilds.cache.get(guildId);
        if (!guild) {
            return false;
        }

        return this.multiBotManager.isResponsibleClient(this, guild);
    }

    public build: () => Promise<this> = async () => {
        this.startTimestamp = Date.now();
        setCookiesManager(this.cookies);
        this.events.load();
        await this.login(this.botToken);

        // Register this client with the multi-bot manager
        this.multiBotManager.registerClient(this.botIndex, this);

        return this;
    };
}
