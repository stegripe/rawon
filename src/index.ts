import { isDev, shardingMode, shardsCount } from "./config/index.js";
import { createLogger } from "./utils/functions/createLogger.js";

import { ShardingManager } from "discord.js";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const log = createLogger({
    name: "ShardManager",
    type: "manager",
    dev: isDev
});

const manager = new ShardingManager(resolve(dirname(fileURLToPath(import.meta.url)), "bot.js"), {
    totalShards: shardsCount,
    respawn: true,
    token: process.env.DISCORD_TOKEN,
    mode: shardingMode
});

manager.on("shardCreate", shard => {
    log.info(`Shard #${shard.id} has spawned.`);
    shard.on("disconnect", () => log.warn("SHARD_DISCONNECTED: ", { stack: `Shard #${shard.id} has disconnected.` }))
        .on("reconnecting", () => log.info("SHARD_RECONNECTING: ", { stack: `Shard #${shard.id} is reconnecting.` }));
    if (manager.shards.size === manager.totalShards) log.info("All shards are spawned successfully.");
}).spawn().catch(e => log.error(e));
