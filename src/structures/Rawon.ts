import { importURLToString } from "../utils/functions/importURLToString";
import { JSONDataManager } from "../utils/structures/JSONDataManager";
import { CommandManager } from "../utils/structures/CommandManager";
import { ModerationLogs } from "../utils/structures/ModerationLogs";
import { EventsLoader } from "../utils/structures/EventsLoader";
import { ClientUtils } from "../utils/structures/ClientUtils";
import { RawonLogger } from "../utils/structures/RawonLogger";
import { soundcloud } from "../utils/handlers/SoundCloudUtil";
import { SpotifyUtil } from "../utils/handlers/SpotifyUtil";
import { formatMS } from "../utils/functions/formatMS";
import { GuildData } from "../typings";
import * as config from "../config";
import { Client, ClientOptions } from "discord.js";
import { resolve } from "path";
import got from "got";

export class Rawon extends Client {
    public readonly config = config;
    public readonly logger = new RawonLogger({ prod: this.config.isProd });
    public readonly request = got;
    public readonly commands = new CommandManager(this, resolve(importURLToString(import.meta.url), "..", "commands"));
    public readonly events = new EventsLoader(this, resolve(importURLToString(import.meta.url), "..", "events"));
    public readonly data = new JSONDataManager<Record<string, GuildData>>(resolve(process.cwd(), "data.json"));
    public readonly soundcloud = soundcloud;
    public readonly spotify = new SpotifyUtil(this);
    public readonly utils = new ClientUtils(this);
    public readonly modlogs = new ModerationLogs(this);

    public constructor(opt: ClientOptions) { super(opt); }

    public build: () => Promise<this> = async () => {
        const start = Date.now();
        this.events.load();
        this.on("ready", () => {
            this.commands.load();
            this.logger.info(`Ready took ${formatMS(Date.now() - start)}`);
        });
        await this.login();
        return this;
    };
}
