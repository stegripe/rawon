import process from "node:process";
import { clientOptions } from "./config/index.js";
import { Rawon } from "./structures/Rawon.js";
import { MultiBotManager } from "./utils/structures/MultiBotManager.js";
import { NoStackError } from "./utils/structures/NoStackError.js";
import { RawonLogger } from "./utils/structures/RawonLogger.js";

// Parse tokens from environment variable
const tokens = MultiBotManager.parseTokens(process.env.DISCORD_TOKEN);
const isMultiBot = tokens.length > 1;
const multiBotManager = MultiBotManager.getInstance();
multiBotManager.setTokens(tokens);

// Shared logger for multi-bot coordination
const sharedLogger = new RawonLogger({ prod: process.env.NODE_ENV !== "development" });

// Store all clients
const clients: Rawon[] = [];

if (isMultiBot) {
    sharedLogger.info(`[MultiBotManager] Multi-bot mode enabled with ${tokens.length} bots`);
}

// Create clients for each token
for (let i = 0; i < Math.max(1, tokens.length); i++) {
    const token = tokens[i] || process.env.DISCORD_TOKEN;
    const client = new Rawon({
        clientOptions,
        botIndex: i,
        token,
    });
    clients.push(client);
}

// Use the primary client for logging and shared operations
const primaryClient = clients[0];

async function saveAllQueueStates(): Promise<void> {
    const savePromises: Promise<void>[] = [];
    for (const client of clients) {
        for (const [, guild] of client.guilds.cache) {
            if (guild.queue) {
                savePromises.push(guild.queue.saveQueueState());
            }
        }
    }
    await Promise.all(savePromises);
}

process.on("SIGINT", async () => {
    primaryClient.logger.info("Received SIGINT, saving queue states before exit...");
    await saveAllQueueStates();
    process.exit(0);
});

process.on("SIGTERM", async () => {
    primaryClient.logger.info("Received SIGTERM, saving queue states before exit...");
    await saveAllQueueStates();
    process.exit(0);
});

process
    .on("exit", (code) => primaryClient.logger.info(`NodeJS process exited with code ${code}`))
    .on("unhandledRejection", (reason) =>
        primaryClient.logger.error(
            "UNHANDLED_REJECTION:",
            ((reason as Error).stack?.length ?? 0) ? reason : new NoStackError(reason as string),
        ),
    )
    .on("warning", (...args) => primaryClient.logger.warn(...args))
    .on("uncaughtException", (err) => {
        primaryClient.logger.error("UNCAUGHT_EXCEPTION:", err);
        primaryClient.logger.warn("Uncaught Exception detected, trying to restart...");
        process.exit(1);
    });

// Build all clients
const buildPromises = clients.map(async (client, index) => {
    try {
        await client.build();
        if (isMultiBot) {
            sharedLogger.info(
                `[MultiBotManager] Bot ${index + 1}/${clients.length} (${client.user?.tag ?? "Unknown"}) is ready`,
            );
        }
    } catch (error) {
        sharedLogger.error(`[MultiBotManager] Failed to start bot ${index + 1}:`, error);
        throw error;
    }
});

await Promise.all(buildPromises).catch((error: unknown) =>
    primaryClient.logger.error("PROMISE_ERR:", error),
);

if (isMultiBot) {
    sharedLogger.info(
        `[MultiBotManager] All ${clients.length} bots are now running in multi-bot mode`,
    );
}
