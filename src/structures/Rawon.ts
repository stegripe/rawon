import { CommandManager } from "../utils/structures/CommandManager.js";
import { ModuleManager } from "../utils/structures/ModuleManager.js";
import { createLogger } from "../utils/functions/createLogger.js";
import { ClientUtils } from "../utils/structures/ClientUtils.js";
import { EventLoader } from "../utils/structures/EventLoader.js";
import { formatMS } from "../utils/functions/formatMS.js";
import * as config from "../config/index.js";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "discord.js";
import got from "got";

const path = dirname(fileURLToPath(import.meta.url));

export class Rawon extends Client {
    public readonly request = got;
    public readonly config = config;
    public readonly utils = new ClientUtils(this);
    public readonly modules = new ModuleManager(this);
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
        const listener = (): void => {
            this.logger.info(`Ready in ${formatMS(Date.now() - start)}.`);

            this.removeListener("ready", listener);
        };

        globalThis.getModule = (id: string) => this.modules.modules.get(id)?.exports;

        this.on("ready", listener);
        await this.modules.load(resolve(path, "..", "modules"), () => this.login(token));

        return this;
    }
}
