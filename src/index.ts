import nodePath from "node:path";
import process from "node:process";
import { discordTokens, isMultiBot, isProd, shardsCount } from "./config/index.js";
import { importURLToString } from "./utils/functions/importURLToString.js";
import { CustomShardingManager } from "./utils/structures/CustomShardingManager.js";
import { createScopedLogger } from "./utils/structures/createLogger.js";
import { MultiBotLauncher } from "./utils/structures/MultiBotLauncher.js";

const log = createScopedLogger("Main", isProd);

process.on("unhandledRejection", (reason, _promise) => {
    log.error(
        `UNHANDLED_REJECTION: ${reason instanceof Error ? (reason.stack ?? reason) : reason}`,
    );
});

process.on("uncaughtException", (error) => {
    log.error(`UNCAUGHT_EXCEPTION: ${error instanceof Error ? (error.stack ?? error) : error}`);
});

if (isMultiBot && discordTokens.length > 1) {
    log.info(
        `[MultiBot] Using custom multi-bot launcher for ${discordTokens.length} bot instances.`,
    );

    const launcher = new MultiBotLauncher();
    await launcher.start().catch((error: unknown) => {
        log.error(`MULTIBOT_LAUNCHER_ERR: ${error}`);
        process.exit(1);
    });
} else {
    const botFile = nodePath.resolve(importURLToString(import.meta.url), "bot.js");
    const token = discordTokens[0] ?? process.env.DISCORD_TOKEN ?? "";

    if (!token) {
        log.error("[FATAL] DISCORD_TOKEN is not set in environment variables!");
        process.exit(1);
    }

    const manager = new CustomShardingManager({
        file: botFile,
        totalShards: shardsCount,
        respawn: true,
        token,
        logger: log,
    });

    manager.on("shardCreate", (shard) => {
        log.info(`[ShardManager] Shard #${shard.id} has spawned.`);
    });

    manager.on("shardReady", (shard) => {
        log.info(`[ShardManager] Shard #${shard.id} is ready.`);
        if (manager.shards.size === manager.totalShards) {
            log.info("[ShardManager] All shards are spawned successfully.");
        }
    });

    manager.on("shardDisconnect", (shard) => {
        log.warn(`[ShardManager] Shard #${shard.id} has disconnected.`);
    });

    manager.on("shardReconnecting", (shard) => {
        log.info(`[ShardManager] Shard #${shard.id} is reconnecting.`);
    });

    manager.on("shardError", (shard, error) => {
        log.error({ err: error }, `[ShardManager] Shard #${shard.id} error`);
    });

    manager.on("shardDeath", (shard, data) => {
        if (data.code !== 0) {
            log.warn(
                `[ShardManager] Shard #${shard.id} died unexpectedly with code ${data.code} and signal ${data.signal}`,
            );
        }
    });

    const shutdown = async (): Promise<void> => {
        log.info("[ShardManager] Received shutdown signal, killing all shards...");
        await manager.killAll("SIGTERM");
        process.exit(0);
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);

    await manager.spawn().catch((error: unknown) => {
        log.error(`SHARD_SPAWN_ERR: ${error}`);
        process.exit(1);
    });
}
