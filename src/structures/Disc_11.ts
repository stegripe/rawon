/* eslint-disable no-underscore-dangle, @typescript-eslint/unbound-method, @typescript-eslint/restrict-plus-operands, @typescript-eslint/naming-convention */
import { Client, Collection, ClientOptions } from "discord.js";
import { resolve } from "path";
import * as config from "../config";
import { createLogger } from "../utils/Logger";
import { CommandsManager } from "../utils/CommandsManager";
import { ListenerLoader } from "../utils/ListenerLoader";
import { YoutubeAPI } from "../utils/YoutubeAPI";

// Extends DiscordJS Structures
import "./Guild";

export class Disc_11 extends Client {
    public readonly config = config;
    public readonly logger = createLogger(config.name, config.debug);
    public readonly youtube = new YoutubeAPI(process.env.YT_API_KEY!);
    public readonly commands = new CommandsManager(this, resolve(__dirname, "..", "commands"));
    public readonly listenerLoader = new ListenerLoader(this, resolve(__dirname, "..", "listeners"));
    public constructor(opt: ClientOptions) { super(opt); }

    public async build(token: string): Promise<Disc_11> {
        this.on("ready", () => this.commands.load());
        this.listenerLoader.load().catch(e => this.logger.error("LISTENER_LOADER_ERR:", e));
        await this.login(token);
        return this;
    }

    public async getGuildsCount(): Promise<number> {
        if (!this.shard) return this.guilds.cache.size;
        const size = await this.shard.broadcastEval("this.guilds.cache.size");
        return size.reduce((p, v) => p + v, 0);
    }

    public async getChannelsCount(filter = true): Promise<number> {
        if (filter) {
            if (!this.shard) return this.channels.cache.filter(c => c.type !== "category" && c.type !== "dm").size;
            const size = await this.shard.broadcastEval("this.channels.cache.filter(c => c.type !== 'category' && c.type !== 'dm').size");
            return size.reduce((p, v) => p + v, 0);
        }
        if (!this.shard) return this.channels.cache.size;
        const size = await this.shard.broadcastEval("this.channels.cache.size");
        return size.reduce((p, v) => p + v, 0);
    }

    public async getUsersCount(filter = true): Promise<number> {
        const temp = new Collection();
        if (filter) {
            if (!this.shard) return this.users.cache.filter(u => !u.equals(this.user!)).size;
            const shards = await this.shard.broadcastEval("this.users.cache.filter(u => !u.equals(this.user))");
            for (const shard of shards) { for (const user of shard) { temp.set(user.id, user); } }
            return temp.size;
        }
        if (!this.shard) return this.users.cache.size;
        const shards = await this.shard.broadcastEval("this.users.cache");
        for (const shard of shards) { for (const user of shard) { temp.set(user.id, user); } }
        return temp.size;
    }

    public async getTotalPlaying(): Promise<number> {
        if (!this.shard) return this.guilds.cache.filter((g: any) => g.queue !== null && g.queue.playing === true).size;
        return this.shard.broadcastEval("this.guilds.cache.filter(g => g.queue !== null && g.queue.playing === true).size").then(data => data.reduce((a, b) => a + b));
    }

    public async getTotalMemory(type: keyof NodeJS.MemoryUsage): Promise<number> {
        if (!this.shard) return process.memoryUsage()[type];
        return this.shard.broadcastEval(`process.memoryUsage()["${type}"]`).then(data => data.reduce((a, b) => a + b));
    }
}
