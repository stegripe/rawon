import { soundcloud } from "../utils/handlers/SoundCloudUtil";
import { CommandManager } from "../utils/CommandManager";
import { EventsLoader } from "../utils/EventsLoader";
import { ClientUtils } from "../utils/ClientUtils";
import { DiscLogger } from "../utils/DiscLogger";
import { formatMS } from "../utils/formatMS";
import * as config from "../config";
import { Client, ClientOptions } from "discord.js";
import { resolve } from "path";
import got from "got";

export class Disc extends Client {
    public readonly config = config;
    public readonly logger = new DiscLogger({ prod: this.config.isProd });
    public readonly request = got;
    public readonly commands = new CommandManager(this, resolve(__dirname, "..", "commands"));
    public readonly events = new EventsLoader(this, resolve(__dirname, "..", "events"));
    public readonly soundcloud = soundcloud;
    public readonly utils = new ClientUtils(this);

    public constructor(opt: ClientOptions) { super(opt); }

    public async build(): Promise<this> {
        const start = Date.now();
        this.events.load();
        this.on("ready", async () => {
            await this.commands.load();
            this.logger.info(`Ready took ${formatMS(Date.now() - start)}`);
        });
        await this.login();
        return this;
    }
}
