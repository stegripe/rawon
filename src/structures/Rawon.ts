import path from "node:path";
import process from "node:process";
import { Client } from "discord.js";
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
import { MultiClientManager } from "../utils/structures/MultiClientManager.js";
import { RawonLogger } from "../utils/structures/RawonLogger.js";
import { RequestChannelManager } from "../utils/structures/RequestChannelManager.js";
import { setCookiesManager } from "../utils/yt-dlp/index.js";

export class Rawon extends Client {
    public startTimestamp = 0;
    public readonly config = config;
    public readonly commands = new CommandManager(
        this,
        path.resolve(importURLToString(import.meta.url), "..", "commands"),
    );
    public readonly events = new EventsLoader(
        this,
        path.resolve(importURLToString(import.meta.url), "..", "events"),
    );
    public readonly data = new JSONDataManager<Record<string, GuildData>>(
        path.resolve(process.cwd(), "cache", "data.json"),
    );
    public readonly logger = new RawonLogger({ prod: this.config.isProd });
    public readonly debugLog = new DebugLogManager(this.config.debugMode, this.config.isProd);
    public readonly spotify = new SpotifyUtil(this);
    public readonly utils = new ClientUtils(this);
    public readonly soundcloud = new Soundcloud();
    public readonly requestChannelManager = new RequestChannelManager(this);
    public readonly audioCache = new AudioCacheManager(this);
    public readonly cookies = new CookiesManager(this);
    public readonly multiClientManager = MultiClientManager.getInstance();
    public clientPriority = 0; // 0 = primary, 1+ = secondary

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

    /**
     * Check if this client should handle events for a specific guild.
     * In multi-client mode, considers voice channel to determine which bot should handle.
     * @param guildId The guild ID
     * @param userVoiceChannelId Optional - the voice channel ID of the user making the request
     */
    public shouldHandleGuildEvent(guildId: string, userVoiceChannelId?: string): boolean {
        return this.multiClientManager.shouldHandleEvent(this, guildId, userVoiceChannelId);
    }

    /**
     * Check if this is the primary client (priority 0)
     */
    public isPrimaryClient(): boolean {
        return this.clientPriority === 0;
    }

    public build: (token?: string, priority?: number) => Promise<this> = async (
        token?: string,
        priority = 0,
    ) => {
        this.startTimestamp = Date.now();
        this.clientPriority = priority;

        // Only primary client manages cookies
        if (priority === 0) {
            setCookiesManager(this.cookies);
        }

        // Register with multi-client manager
        this.multiClientManager.registerClient(this, priority);

        // Only primary client manages cookies
        if (priority === 0) {
            setCookiesManager(this.cookies);
        }

        // Load events for all clients - they will check shouldHandleGuildEvent()
        // to determine if they should process events for a specific guild
        this.events.load();

        await this.login(token);
        return this;
    };
}
