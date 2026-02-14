import process from "node:process";
import { setInterval } from "node:timers";
import { container } from "@sapphire/framework";
import { clientOptions } from "./config/index.js";
import { Rawon } from "./structures/Rawon.js";
import { NoStackError } from "./utils/structures/NoStackError.js";
import { ShardClientUtil } from "./utils/structures/ShardClientUtil.js";

const token = process.env.DISCORD_TOKEN;

if (!token) {
    console.error("[FATAL] DISCORD_TOKEN is not set in environment variables!");
    process.exit(1);
}

const client = new Rawon(clientOptions);

if (process.env.SHARD_ID !== undefined) {
    (client as any).shard = new ShardClientUtil(client);
}

if (process.send) {
    process.on("message", async (message: any) => {
        const shardId = parseInt(process.env.SHARD_ID ?? "0", 10);

        if (message.type === "eval" && message.shardId === shardId) {
            try {
                let result: any;
                const script = message.script;
                const context = message.context;

                if (typeof script === "string") {
                    const func = new Function(
                        "client",
                        "context",
                        `return (${script})(client, context)`,
                    );
                    result = await func(client, context);
                } else {
                    result = await script(client, context);
                }

                process.send?.({
                    type: "eval",
                    evalId: message.evalId,
                    shardId,
                    result,
                });
            } catch (error: any) {
                process.send?.({
                    type: "eval",
                    evalId: message.evalId,
                    shardId,
                    error: error?.message ?? String(error),
                });
            }
        } else if (message.type === "broadcastEval") {
            try {
                const script = message.script;
                const context = message.context;

                const func = new Function(
                    "client",
                    "context",
                    `return (${script})(client, context)`,
                );
                const result = await func(client, context);

                process.send?.({
                    type: "broadcastEvalResult",
                    evalId: message.evalId,
                    shardId,
                    result,
                });
            } catch (error: any) {
                process.send?.({
                    type: "broadcastEvalResult",
                    evalId: message.evalId,
                    shardId,
                    error: error?.message ?? String(error),
                });
            }
        }
    });

    setInterval(() => {
        const shardId = parseInt(process.env.SHARD_ID ?? "0", 10);
        process.send?.({
            type: "heartbeat",
            shardId,
        });
    }, 30_000);
}

async function saveAllQueueStates(): Promise<void> {
    const savePromises: Promise<void>[] = [];
    for (const [, guild] of client.guilds.cache) {
        if (guild.queue) {
            savePromises.push(guild.queue.saveQueueState());
        }
    }
    await Promise.all(savePromises);
}

process.on("SIGINT", async () => {
    container.logger.info(
        "Received SIGINT, saving queue states and closing browser before exit...",
    );
    await saveAllQueueStates();
    await client.cookies.shutdown().catch(() => {
        // Ignore shutdown errors during exit
    });
    process.exit(0);
});

process.on("SIGTERM", async () => {
    container.logger.info(
        "Received SIGTERM, saving queue states and closing browser before exit...",
    );
    await saveAllQueueStates();
    await client.cookies.shutdown().catch(() => {
        // Ignore shutdown errors during exit
    });
    process.exit(0);
});

process
    .on("exit", (code) => container.logger.info(`NodeJS process exited with code ${code}`))
    .on("unhandledRejection", (reason) =>
        container.logger.error(
            ((reason as Error).stack?.length ?? 0) ? reason : new NoStackError(reason as string),
            "UNHANDLED_REJECTION",
        ),
    )
    .on("warning", (...args) => container.logger.warn({ args }, "NODE_WARNING"))
    .on("uncaughtException", (err) => {
        container.logger.error(err, "UNCAUGHT_EXCEPTION");
        container.logger.warn("Uncaught Exception detected, trying to restart...");
        process.exit(1);
    });

await client
    .build(token)
    .then(() => {
        if (process.send) {
            const shardId = parseInt(process.env.SHARD_ID ?? "0", 10);
            process.send({
                type: "ready",
                shardId,
            });
        }
    })
    .catch((error: unknown) => {
        container.logger.error(error, "PROMISE_ERR");
        if (process.send) {
            const shardId = parseInt(process.env.SHARD_ID ?? "0", 10);
            process.send({
                type: "error",
                shardId,
                error: error instanceof Error ? error.message : String(error),
            });
        }
        process.exit(1);
    });
