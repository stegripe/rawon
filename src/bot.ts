import process from "node:process";
import { setTimeout } from "node:timers";
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

const SAVE_QUEUE_TIMEOUT_MS = 5000;

async function saveAllQueueStates(): Promise<void> {
    const savePromises: Promise<void>[] = [];
    for (const [guildId, guild] of client.guilds.cache) {
        if (guild.queue) {
            const timeout = new Promise<void>((_, reject) =>
                setTimeout(
                    () => reject(new Error(`Save timeout for guild ${guildId}`)),
                    SAVE_QUEUE_TIMEOUT_MS,
                ),
            );
            savePromises.push(
                Promise.race([guild.queue.saveQueueState(), timeout]).catch((err) => {
                    container.logger.warn(
                        `[Shutdown] Queue save timeout/skip for guild ${guildId}:`,
                        err,
                    );
                }),
            );
        }
    }
    await Promise.all(savePromises);
}

async function gracefulShutdown(signal: string): Promise<void> {
    container.logger.info(`Received ${signal}, shutting down gracefully...`);
    const shutdownStart = Date.now();

    const saveStart = Date.now();
    await saveAllQueueStates();
    container.logger.info(`[Shutdown] Queue states saved in ${Date.now() - saveStart}ms`);

    const cookiesStart = Date.now();
    await client.cookies.shutdown().catch(() => {});
    container.logger.info(`[Shutdown] Browser closed in ${Date.now() - cookiesStart}ms`);

    client.destroy();
    container.logger.info(`[Shutdown] Complete in ${Date.now() - shutdownStart}ms`);

    process.exit(0);
}

process.on("SIGINT", () => void gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => void gracefulShutdown("SIGTERM"));

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
