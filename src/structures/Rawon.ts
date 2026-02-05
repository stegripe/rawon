import path from "node:path";
import process from "node:process";
import { container, SapphireClient } from "@sapphire/framework";
import { PinoLogger } from "@stegripe/pino-logger";
import { type ClientOptions } from "discord.js";
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
            logger: {
                instance: new PinoLogger({
                    name: "rawon",
                    timestamp: true,
                    level: config.isDev ? "debug" : "info",
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

        const loginToken = token ?? process.env.DISCORD_TOKEN;
        if (!loginToken) {
            throw new Error("No token provided for login");
        }

        await this.login(loginToken);

        if (this.config.isMultiBot && this.user) {
            container.logger.info(
                `[MultiBot] Bot ${this.user.tag} is in ${this.guilds.cache.size} guild(s): ${Array.from(this.guilds.cache.keys()).join(", ")}`,
            );
        }

        return this;
    };
}
