import { enableRepl, isProd, shardingMode, shardsCount } from "./config/index.js";
import { importURLToString } from "./utils/functions/importURLToString.js";
import { RawonLogger } from "./utils/structures/RawonLogger.js";
import { ShardingManager } from "discord.js";
import { resolve } from "node:path";
import { start } from "node:repl";

const log = new RawonLogger({ prod: isProd });

const manager = new ShardingManager(resolve(importURLToString(import.meta.url), "bot.js"), {
    totalShards: shardsCount,
    respawn: true,
    token: process.env.DISCORD_TOKEN,
    mode: shardingMode
});

if (enableRepl) {
    const repl = start({
        prompt: "> "
    });

    repl.context.shardManager = manager;
    process.stdin.on("data", _ => repl.displayPrompt(true));
    repl.on("exit", () => process.exit());
}

manager
    .on("shardCreate", shard => {
        log.info(`[ShardManager] Shard #${shard.id} has spawned.`);
        shard
            .on("disconnect", () =>
                log.warn("SHARD_DISCONNECTED: ", { stack: `[ShardManager] Shard #${shard.id} has disconnected.` })
            )
            .on("reconnecting", () => log.info(`[ShardManager] Shard #${shard.id} has reconnected.`));
        if (manager.shards.size === manager.totalShards)
            log.info("[ShardManager] All shards are spawned successfully.");
    })
    .spawn()
    .catch(e => log.error("SHARD_SPAWN_ERR: ", e));
