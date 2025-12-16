import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import type { ClientOptions } from "discord.js";
import { Client } from "discord.js";
import got from "got";
import { Soundcloud } from "soundcloud.ts";
import * as config from "../config/index.js";
import type { GuildData } from "../typings/index.js";
import { importURLToString } from "../utils/functions/importURLToString.js";
import { SpotifyUtil } from "../utils/handlers/SpotifyUtil.js";
import { ClientUtils } from "../utils/structures/ClientUtils.js";
import { CommandManager } from "../utils/structures/CommandManager.js";
import { DebugLogManager } from "../utils/structures/DebugLogManager.js";
import { EventsLoader } from "../utils/structures/EventsLoader.js";
import { JSONDataManager } from "../utils/structures/JSONDataManager.js";
import { RawonLogger } from "../utils/structures/RawonLogger.js";
import { RequestChannelManager } from "../utils/structures/RequestChannelManager.js";

const dataDir = process.env.DATA_DIR ?? process.cwd();
if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true });
}

export class Rawon extends Client {
    public startTimestamp = 0;
    public readonly config = config;
    public readonly commands = new CommandManager(this, path.resolve(importURLToString(import.meta.url), "..", "commands"));
    public readonly events = new EventsLoader(this, path.resolve(importURLToString(import.meta.url), "..", "events"));
    public readonly data = new JSONDataManager<Record<string, GuildData>>(path.resolve(dataDir, "data.json"));
    public readonly logger = new RawonLogger({ prod: this.config.isProd });
    public readonly debugLog = new DebugLogManager(this.config.debugMode, this.config.isProd);
    public readonly spotify = new SpotifyUtil(this);
    public readonly utils = new ClientUtils(this);
    public readonly soundcloud = new Soundcloud();
    public readonly requestChannelManager = new RequestChannelManager(this);
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
                        // eslint-disable-next-line unicorn/text-encoding-identifier-case
                        ["Encoding", options.encoding ?? "UTF-8"],
                        // eslint-disable-next-line typescript/strict-boolean-expressions
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
