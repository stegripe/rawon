import "dotenv/config";
import { resolve } from "path";
import { ShardingManager } from "discord.js";
import { createLogger } from "./utils/Logger";
import { totalShards, name, debug } from "./config";
const log = createLogger(`${name}-sharding`, debug);

const shardCount: number | "auto" = totalShards === "auto" ? totalShards : Number(totalShards);

process.on("unhandledRejection", e => {
    log.error("UNHANDLED_REJECTION: ", e);
});
process.on("uncaughtException", e => {
    log.error("UNCAUGHT_EXCEPTION: ", e);
    log.warn("Uncaught Exception detected. Restarting...");
    process.exit(1);
});

const manager = new ShardingManager(resolve(__dirname, "bot.js"), { totalShards: shardCount, mode: "process", respawn: true, token: process.env.DISCORD_TOKEN });

manager.on("shardCreate", shard => {
    log.info(`[ShardManager] Shard #${shard.id} has spawned.`);
    shard.on("disconnect", () => {
        log.warn("SHARD_DISCONNECTED: ", { stack: `[ShardManager] Shard #${shard.id} has disconnected` });
    }).on("reconnecting", () => {
        log.info(`[ShardManager] Shard #${shard.id} has reconnected.`);
    });
    if (manager.shards.array().length === manager.totalShards) log.info("[ShardManager] All shards spawned successfully.");
}).spawn(shardCount).catch(e => log.error("SHARD_SPAWN_ERR: ", e));
