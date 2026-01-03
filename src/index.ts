import process from "node:process";
import { ShardingManager } from "discord.js";
import {
    discordTokens,
    isMultiBot,
    isProd,
    shardingMode,
    shardsCount,
} from "./config/index.js";
import nodePath from "node:path";
import { importURLToString } from "./utils/functions/importURLToString.js";
import { RawonLogger } from "./utils/structures/RawonLogger.js";
import { MultiBotLauncher } from "./utils/structures/MultiBotLauncher.js";

const log = new RawonLogger({ prod: isProd });

// Use custom multi-bot launcher if multi-bot mode is enabled
if (isMultiBot && discordTokens.length > 1) {
    log.info(`[MultiBot] Using custom multi-bot launcher for ${discordTokens.length} bot instances.`);
    
    const launcher = new MultiBotLauncher();
    await launcher.start().catch((error: unknown) => {
        log.error("MULTIBOT_LAUNCHER_ERR: ", error);
        process.exit(1);
    });
} else {
    // Single bot mode - use ShardingManager for sharding support
    const manager = new ShardingManager(
        nodePath.resolve(importURLToString(import.meta.url), "bot.js"),
        {
            totalShards: shardsCount,
            respawn: true,
            token: discordTokens[0] ?? process.env.DISCORD_TOKEN,
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
