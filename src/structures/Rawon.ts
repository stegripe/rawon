import { importURLToString } from "../utils/functions/importURLToString.js";
import { DebugLogManager } from "../utils/structures/DebugLogManager.js";
import { JSONDataManager } from "../utils/structures/JSONDataManager.js";
import { CommandManager } from "../utils/structures/CommandManager.js";
import { ModerationLogs } from "../utils/structures/ModerationLogs.js";
import { EventsLoader } from "../utils/structures/EventsLoader.js";
import { ClientUtils } from "../utils/structures/ClientUtils.js";
import { RawonLogger } from "../utils/structures/RawonLogger.js";
import { SpotifyUtil } from "../utils/handlers/SpotifyUtil.js";
import { GuildData } from "../typings/index.js";
import * as config from "../config/index.js";
import { Client, ClientOptions } from "discord.js";
import { Soundcloud } from "soundcloud.ts";
import { resolve } from "node:path";
import got from "got";

export class Rawon extends Client {
    public startTimestamp = 0;
    public readonly config = config;
    public readonly commands = new CommandManager(this, resolve(importURLToString(import.meta.url), "..", "commands"));
    public readonly events = new EventsLoader(this, resolve(importURLToString(import.meta.url), "..", "events"));
    public readonly data = new JSONDataManager<Record<string, GuildData>>(resolve(process.cwd(), "data.json"));
    public readonly logger = new RawonLogger({ prod: this.config.isProd });
    public readonly debugLog = new DebugLogManager(this.config.debugMode, this.config.isProd);
    public readonly modlogs = new ModerationLogs(this);
    public readonly spotify = new SpotifyUtil(this);
    public readonly utils = new ClientUtils(this);
    public readonly soundcloud = new Soundcloud();
    public readonly request = got.extend({
        hooks: {
            beforeError: [
                error => {
                    this.debugLog.logData("error", "GOT_REQUEST", [
                        ["URL", error.options.url?.toString() ?? "[???]"],
                        ["Code", error.code],
                        ["Response", error.response?.rawBody.toString("ascii") ?? "[???]"]
                    ]);

                    return error;
                }
            ],
            beforeRequest: [
                options => {
                    this.debugLog.logData("info", "GOT_REQUEST", [
                        ["URL", options.url?.toString() ?? "[???]"],
                        ["Method", options.method],
                        ["Encoding", options.encoding ?? "UTF-8"],
                        ["Agent", options.agent.http ? "HTTP" : "HTTPS"]
                    ]);
                }
            ]
        }
    });

    public constructor(opt: ClientOptions) {
        super(opt);
    }

    public build: () => Promise<this> = async () => {
        this.startTimestamp = Date.now();
        this.events.load();
        await this.login();
        return this;
    };
}
