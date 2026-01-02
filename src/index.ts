import nodePath from "node:path";
import process from "node:process";
import { ShardingManager } from "discord.js";
import { isProd, shardingMode, shardsCount } from "./config/index.js";
import { importURLToString } from "./utils/functions/importURLToString.js";
import { MultiBotManager } from "./utils/structures/MultiBotManager.js";
import { RawonLogger } from "./utils/structures/RawonLogger.js";

const log = new RawonLogger({ prod: isProd });

// Get the primary token (first token if multiple are provided)
const primaryToken = MultiBotManager.getPrimaryToken() ?? process.env.DISCORD_TOKEN;
const isMultiBot = MultiBotManager.isMultiBotEnabled();

if (isMultiBot) {
    const tokens = MultiBotManager.parseTokens(process.env.DISCORD_TOKEN);
    log.info(
        `[MultiBotManager] Detected ${tokens.length} bot tokens - multi-bot mode will be enabled`,
    );
}

const manager = new ShardingManager(
    nodePath.resolve(importURLToString(import.meta.url), "bot.js"),
    {
        totalShards: shardsCount,
        respawn: true,
        token: primaryToken,
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
