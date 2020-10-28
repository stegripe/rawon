/* eslint-disable no-underscore-dangle, @typescript-eslint/unbound-method, @typescript-eslint/restrict-plus-operands */
import type { ClientOptions } from "discord.js";
import { Client } from "discord.js";
import { resolve } from "path";
import config from "../config";
import { createLogger } from "../utils/Logger";
import CommandsHandler from "../utils/CommandsHandler";
import ListenerLoader from "../utils/ListenerLoader";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error // FIX: Find or create typings for simple-youtube-api or wait for v6 released
import YouTube from "simple-youtube-api";

// Extends DiscordJS Structures
import "./Guild";

export default class Disc_11 extends Client {
    public readonly config = config;
    public readonly logger = createLogger(config.name, true);
    public readonly youtube = new YouTube(process.env.YT_API_KEY!, { cache: false, fetchAll: true });
    public readonly CommandsHandler = new CommandsHandler(this, resolve(__dirname, "..", "commands"));
    public readonly ListenerLoader = new ListenerLoader(this, resolve(__dirname, "..", "listeners"));
    public constructor(opt: ClientOptions) { super(opt); }

    public async build(token: string): Promise<Disc_11> {
        this.on("ready", () => this.CommandsHandler.load());
        this.ListenerLoader.load().catch(e => this.logger.error("LISTENER_LOADER_ERR:", e));
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
        if (filter) {
            if (!this.shard) return this.users.cache.filter(u => !u.equals(this.user!)).size;
            const size = await this.shard.broadcastEval("this.users.cache.filter(u => !u.equals(this.user)).size");
            return size.reduce((p, v) => p + v, 0);
        }
        if (!this.shard) return this.users.cache.size;
        const size = await this.shard.broadcastEval("this.users.cache.size");
        return size.reduce((p, v) => p + v, 0);
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
