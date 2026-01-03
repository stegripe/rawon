import process from "node:process";
import { clientOptions } from "./config/index.js";
import { Rawon } from "./structures/Rawon.js";
import { NoStackError } from "./utils/structures/NoStackError.js";

// Get token from environment (ShardingManager sets this for each shard process)
const token = process.env.DISCORD_TOKEN;

if (!token) {
    console.error("[FATAL] DISCORD_TOKEN is not set in environment variables!");
    process.exit(1);
}

const client = new Rawon(clientOptions);

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
    client.logger.info("Received SIGINT, saving queue states before exit...");
    await saveAllQueueStates();
    process.exit(0);
});

process.on("SIGTERM", async () => {
    client.logger.info("Received SIGTERM, saving queue states before exit...");
    await saveAllQueueStates();
    process.exit(0);
});

process
    .on("exit", (code) => client.logger.info(`NodeJS process exited with code ${code}`))
    .on("unhandledRejection", (reason) =>
        client.logger.error(
            "UNHANDLED_REJECTION:",
            ((reason as Error).stack?.length ?? 0) ? reason : new NoStackError(reason as string),
        ),
    )
    .on("warning", (...args) => client.logger.warn(...args))
    .on("uncaughtException", (err) => {
        client.logger.error("UNCAUGHT_EXCEPTION:", err);
        client.logger.warn("Uncaught Exception detected, trying to restart...");
        process.exit(1);
    });

await client.build(token).catch((error: unknown) => client.logger.error("PROMISE_ERR:", error));
