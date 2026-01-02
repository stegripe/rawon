import nodePath from "node:path";
import process from "node:process";
import { ShardingManager } from "discord.js";
import { getDiscordTokens, isProd, shardingMode, shardsCount } from "./config/index.js";
import { importURLToString } from "./utils/functions/importURLToString.js";
import { RawonLogger } from "./utils/structures/RawonLogger.js";

const log = new RawonLogger({ prod: isProd });

const tokens = getDiscordTokens();

if (tokens.length === 0) {
    log.error(
        "No Discord token(s) found. Please set DISCORD_TOKEN or DISCORD_TOKEN_1, DISCORD_TOKEN_2, etc. in your .env file.",
    );
    process.exit(1);
}

const getBotLabel = (index: number): string => (tokens.length > 1 ? `[Bot ${index + 1}]` : "");

log.info(`[MultiBot] Starting ${tokens.length} bot instance(s)...`);

const managers: ShardingManager[] = [];

for (let botIndex = 0; botIndex < tokens.length; botIndex++) {
    const token = tokens[botIndex];
    const botLabel = getBotLabel(botIndex);

    const manager = new ShardingManager(
        nodePath.resolve(importURLToString(import.meta.url), "bot.js"),
        {
            totalShards: shardsCount,
            respawn: true,
            token,
            mode: shardingMode,
        },
    );

    manager.on("shardCreate", (shard) => {
        log.info(`${botLabel}[ShardManager] Shard #${shard.id} has spawned.`);
        shard
            .on("disconnect", () =>
                log.warn("SHARD_DISCONNECTED: ", {
                    stack: `${botLabel}[ShardManager] Shard #${shard.id} has disconnected.`,
                }),
            )
            .on("reconnecting", () =>
                log.info(`${botLabel}[ShardManager] Shard #${shard.id} has reconnected.`),
            );
        if (manager.shards.size === manager.totalShards) {
            log.info(`${botLabel}[ShardManager] All shards are spawned successfully.`);
        }
    });

    managers.push(manager);
}

await Promise.all(
    managers.map((manager, index) => {
        const botLabel = getBotLabel(index);
        return manager.spawn().catch((error: unknown) => {
            log.error(`${botLabel}SHARD_SPAWN_ERR: `, error);
        });
    }),
);

if (managers.length > 1) {
    log.info(`[MultiBot] All ${managers.length} bot instances have been started.`);
}
