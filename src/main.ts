import "dotenv/config";
import { createLogger } from "./utils/Logger";
import { debug, totalShards as configTotalShards } from "./config";
import { ShardingManager } from "discord.js";
import { resolve } from "path";

const log = createLogger("shardingmanager", debug);

const totalShards: number | "auto" = configTotalShards === "auto" ? configTotalShards : Number(configTotalShards);

process.on("unhandledRejection", e => {
    log.error("UNHANDLED_REJECTION: ", e);
});
process.on("uncaughtException", e => {
    log.error("UNCAUGHT_EXCEPTION: ", e);
    log.warn("Uncaught Exception detected, restarting...");
    process.exit(1);
});

const manager = new ShardingManager(resolve(__dirname, "bot.js"), {
    totalShards,
    mode: "worker",
    respawn: true,
    token: process.env.SECRET_DISCORD_TOKEN
});

manager.on("shardCreate", shard => {
    log.info(`[ShardManager] Shard #${shard.id} has spawned`);
    shard.on("disconnect", () => {
        log.warn("SHARD_DISCONNECTED: ", { stack: `[ShardManager] Shard #${shard.id} has disconnected` });
    }).on("reconnecting", () => {
        log.info(`[ShardManager] Shard #${shard.id} has reconnected`);
    });
    if (manager.shards.size === manager.totalShards) log.info("[ShardManager] All shards has spawned successfully.");
}).spawn().catch(e => log.error("SHARD_SPAWN_ERR: ", e));
