import { CommandManager } from "../utils/structures/CommandManager.js";
import { createLogger } from "../utils/functions/createLogger.js";
import { ClientUtils } from "../utils/structures/ClientUtils.js";
import { EventLoader } from "../utils/structures/EventLoader.js";
import * as config from "../config/index.js";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "discord.js";
import got from "got";
import { formatMS } from "../utils/functions/formatMS.js";

const path = dirname(fileURLToPath(import.meta.url));

export class BotClient extends Client {
    public readonly request = got;
    public readonly config = config;
    public readonly utils = new ClientUtils(this);
    public readonly commands = new CommandManager(this);
    public readonly events = new EventLoader(this);
    public readonly logger = createLogger({
        name: "bot",
        shardId: this.shard!.ids[0],
        type: "shard",
        dev: this.config.isDev
    });

    public async build(token?: string): Promise<this> {
        const start = Date.now();
        await this.events.readFromDir(resolve(path, "..", "events"));
        const listener = (): void => {
            void this.commands.readFromDir(resolve(path, "..", "commands"));
            this.logger.info(`Ready in ${formatMS(Date.now() - start)}.`);

            this.removeListener("ready", listener);
        };

        this.on("ready", listener);
        await this.login(token);
        return this;
    }
}
