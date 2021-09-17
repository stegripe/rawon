import "dotenv/config";
import { totalShards as configTotalShards, debug } from "./config";
import { createLogger } from "./utils/Logger";
import { ShardingManager } from "discord.js";
import { resolve } from "path";

const log = createLogger("shardingmanager", debug);

const totalShards: number | "auto" = configTotalShards === "auto" ? configTotalShards : Number(configTotalShards);

process.on("unhandledRejection", e => {
    log.error("UNHANDLED_REJECTION: ", e);
});
process.on("uncaughtException", e => {
    log.error("UNCAUGHT_EXCEPTION: ", e);
    log.warn("Uncaught Exception detected. Restarting...");
    process.exit(1);
});

const manager = new ShardingManager(resolve(__dirname, "bot.js"), {
    totalShards,
    mode: "worker",
    respawn: true,
    token: process.env.SECRET_DISCORD_TOKEN
});

manager.on("shardCreate", shard => {
    log.info(`[ShardManager] Shard #${shard.id} Spawned.`);
    shard.on("disconnect", () => {
        log.warn("SHARD_DISCONNECTED: ", { stack: `[ShardManager] Shard #${shard.id} Disconnected` });
    }).on("reconnecting", () => {
        log.info(`[ShardManager] Shard #${shard.id} Reconnected.`);
    });
    if (manager.shards.size === manager.totalShards) log.info("[ShardManager] All shards spawned successfully.");
}).spawn(totalShards).catch(e => log.error("SHARD_SPAWN_ERR: ", e));
