import nodePath from "node:path";
import process from "node:process";
import { ShardingManager } from "discord.js";
import { getDiscordTokens, isProd, shardingMode, shardsCount } from "./config/index.js";
import { importURLToString } from "./utils/functions/importURLToString.js";
import { RawonLogger } from "./utils/structures/RawonLogger.js";

const log = new RawonLogger({ prod: isProd });

const tokens = getDiscordTokens();

if (tokens.length === 0) {
    log.error("No Discord token(s) found. Please set DISCORD_TOKEN in your .env file.");
    process.exit(1);
}

// Multi-client mode: spawn bot.ts directly without ShardingManager
// This allows all clients to run in ONE process with proper coordination
if (tokens.length > 1) {
    log.info(
        `[MultiClient] Detected ${tokens.length} tokens. Starting unified multi-client mode...`,
    );
    // Import and run bot.ts directly (no sharding for multi-client)
    try {
        await import("./bot.js");
    } catch (error: unknown) {
        log.error("[MultiClient] Failed to start multi-client mode:", error);
        process.exit(1);
    }
} else {
    // Single-client mode: use ShardingManager as before
    const manager = new ShardingManager(
        nodePath.resolve(importURLToString(import.meta.url), "bot.js"),
        {
            totalShards: shardsCount,
            respawn: true,
            token: tokens[0],
            mode: shardingMode,
        },
    );

    await manager
        .on("shardCreate", (shard) => {
            log.info(`[ShardManager] Shard #${shard.id} has spawned.`);
            shard
                .on("disconnect", () =>
                    log.warn("SHARD_DISCONNECTED: ", {
                        stack: `[ShardManager] Shard #${shard.id} has disconnected.`,
                    }),
                )
                .on("reconnecting", () =>
                    log.info(`[ShardManager] Shard #${shard.id} has reconnected.`),
                );
            if (manager.shards.size === manager.totalShards) {
                log.info("[ShardManager] All shards are spawned successfully.");
            }
        })
        .spawn()
        .catch((error: unknown) => log.error("SHARD_SPAWN_ERR: ", error));
}
