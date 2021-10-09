import "dotenv/config";
import { isProd, shardingMode, shardsCount } from "./config";
import { createLogger } from "./utils/Logger";
import { ShardingManager } from "discord.js";
import { resolve } from "path";

const log = createLogger("shardingmanager", isProd);

const manager = new ShardingManager(resolve(__dirname, "bot.js"), {
    totalShards: shardsCount,
    respawn: true,
    token: process.env.DISCORD_TOKEN,
    mode: shardingMode
});

manager.on("shardCreate", shard => {
    log.info(`[ShardManager] Shard #${shard.id} Spawned.`);
    shard.on("disconnect", () => {
        log.warn("SHARD_DISCONNECTED: ", { stack: `[ShardManager] Shard #${shard.id} Disconnected.` });
    }).on("reconnecting", () => {
        log.info(`[ShardManager] Shard #${shard.id} Reconnected.`);
    });
    if (manager.shards.size === manager.totalShards) log.info("[ShardManager] All shards spawned successfully.");
}).spawn().catch(e => log.error("SHARD_SPAWN_ERR: ", e));
