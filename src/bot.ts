import process from "node:process";
import { ApplicationCommandRegistries, container, RegisterBehavior } from "@sapphire/framework";
import { clientOptions } from "./config/index.js";
import { Rawon } from "./structures/Rawon.js";
import { NoStackError } from "./utils/structures/NoStackError.js";

const token = process.env.DISCORD_TOKEN;

if (!token) {
    console.error("[FATAL] DISCORD_TOKEN is not set in environment variables!");
    process.exit(1);
}

ApplicationCommandRegistries.setDefaultBehaviorWhenNotIdentical(RegisterBehavior.BulkOverwrite);

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
    container.logger.info(
        "Received SIGINT, saving queue states and closing browser before exit...",
    );
    await saveAllQueueStates();
    await client.cookies.shutdown().catch(() => {});
    process.exit(0);
});

process.on("SIGTERM", async () => {
    container.logger.info(
        "Received SIGTERM, saving queue states and closing browser before exit...",
    );
    await saveAllQueueStates();
    await client.cookies.shutdown().catch(() => {});
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

await client.build(token).catch((error: unknown) => {
    container.logger.error(error, "PROMISE_ERR");
    process.exit(1);
});
