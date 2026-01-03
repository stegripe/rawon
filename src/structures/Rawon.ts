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
import { SQLiteDataManager } from "../utils/structures/SQLiteDataManager.js";
import { MultiBotManager } from "../utils/structures/MultiBotManager.js";
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
    public readonly data = new SQLiteDataManager<Record<string, GuildData>>(
        path.resolve(process.cwd(), "cache", "data.db"),
    );
    public readonly logger = new RawonLogger({ prod: this.config.isProd });
    public readonly debugLog = new DebugLogManager(this.config.debugMode, this.config.isProd);
    public readonly spotify = new SpotifyUtil(this);
    public readonly utils = new ClientUtils(this);
    public readonly soundcloud = new Soundcloud();
    public readonly requestChannelManager = new RequestChannelManager(this);
    public readonly audioCache = new AudioCacheManager(this);
    public readonly cookies = new CookiesManager(this);
    public readonly multiBotManager = MultiBotManager.getInstance();
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

    public build: (token?: string) => Promise<this> = async (token?: string) => {
        this.startTimestamp = Date.now();
        setCookiesManager(this.cookies);
        this.events.load();
        
        // Use provided token or fallback to environment variable
        const loginToken = token ?? process.env.DISCORD_TOKEN;
        if (!loginToken) {
            throw new Error("No token provided for login");
        }
        
        await this.login(loginToken);
        
        // Register this bot instance in MultiBotManager if multi-bot is enabled
        if (this.config.isMultiBot && this.user) {
            // Find token index by matching bot ID
            const botId = this.user.id;
            const tokenIndex = this.config.discordIds.findIndex((id) => id === botId);
            if (tokenIndex >= 0) {
                this.multiBotManager.registerBot(this, tokenIndex, botId);
                this.logger.info(
                    `[MultiBot] Registered bot instance ${this.user.tag} (${botId}) at index ${tokenIndex}`,
                );
                
                // Log guilds that this bot is in
                this.logger.info(
                    `[MultiBot] Bot ${this.user.tag} is in ${this.guilds.cache.size} guild(s): ${Array.from(this.guilds.cache.keys()).join(", ")}`,
                );
            } else {
                this.logger.warn(
                    `[MultiBot] Bot ${this.user.tag} (${botId}) not found in DISCORD_ID list, cannot register`,
                );
            }
        }
        
        return this;
    };
}
