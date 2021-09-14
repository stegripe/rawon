import { CommandManager } from "../utils/CommandManager";
import { EventsLoader } from "../utils/EventsLoader";
import { createLogger } from "../utils/Logger";
import { formatMS } from "../utils/formatMS";
import * as config from "../config";
import { Client, ClientOptions } from "discord.js";
import { resolve } from "path";
import got from "got";

export class BotClient extends Client {
    public readonly config = config;
    public readonly logger = createLogger("bot", this.config.isProd);
    public readonly request = got;
    public readonly commands = new CommandManager(this, resolve(__dirname, "..", "commands"));
    public readonly events = new EventsLoader(this, resolve(__dirname, "..", "events"));

    public constructor(opt: ClientOptions) { super(opt); }

    public async build(token: string): Promise<this> {
        const start = Date.now();
        this.events.load();
        this.on("ready", async () => {
            await this.commands.load();
            this.logger.info(`Ready took ${formatMS(Date.now() - start)}`);
        });
        await this.login(token);
        return this;
    }
}
