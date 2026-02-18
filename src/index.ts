import nodePath from "node:path";
import process from "node:process";
import { ShardingManager } from "discord.js";
import {
    discordTokens,
    enableSharding,
    isMultiBot,
    isProd,
    shardingMode,
    shardsCount,
} from "./config/index.js";
import { importURLToString } from "./utils/functions/importURLToString.js";
import { createScopedLogger } from "./utils/structures/createLogger.js";

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
    log.info(`[MultiBot] Starting ${discordTokens.length} bot instances directly...`);

    const { MultiBotLauncher } = await import("./utils/structures/MultiBotLauncher.js");
    const launcher = new MultiBotLauncher();

    await launcher.start().catch((error: unknown) => {
        log.error(`MULTIBOT_LAUNCHER_ERR: ${error}`);
        process.exit(1);
    });
} else if (enableSharding) {
    const botFile = nodePath.resolve(importURLToString(import.meta.url), "bot.js");
    const token = discordTokens[0] ?? process.env.DISCORD_TOKEN ?? "";

    if (!token) {
        log.error("[FATAL] DISCORD_TOKEN is not set in environment variables!");
        process.exit(1);
    }

    const manager = new ShardingManager(botFile, {
        totalShards: shardsCount,
        respawn: true,
        token,
        mode: shardingMode,
    });

    manager.on("shardCreate", (shard) => {
        log.info(`[ShardManager] Shard #${shard.id} has spawned.`);

        shard.on("disconnect", () => {
            log.warn(`[ShardManager] Shard #${shard.id} has disconnected.`);
        });

        shard.on("reconnecting", () => {
            log.info(`[ShardManager] Shard #${shard.id} is reconnecting.`);
        });

        shard.on("error", (error) => {
            log.error({ err: error }, `[ShardManager] Shard #${shard.id} error`);
        });

        shard.on("death", (proc) => {
            const exitCode = "exitCode" in proc ? proc.exitCode : null;
            const signalCode = "signalCode" in proc ? proc.signalCode : null;
            if (exitCode !== 0) {
                log.warn(
                    `[ShardManager] Shard #${shard.id} died with code ${exitCode} signal ${signalCode}`,
                );
            }
        });

        if (manager.shards.size === manager.totalShards) {
            log.info("[ShardManager] All shards are spawned successfully.");
        }
    });

    await manager.spawn().catch((error: unknown) => {
        log.error(`SHARD_SPAWN_ERR: ${error}`);
        process.exit(1);
    });
} else {
    log.info("Sharding disabled, starting bot directly...");
    await import("./bot.js");
}
