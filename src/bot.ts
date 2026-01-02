import process from "node:process";
import { clientOptions, getDiscordTokens } from "./config/index.js";
import { Rawon } from "./structures/Rawon.js";
import { NoStackError } from "./utils/structures/NoStackError.js";
import { RawonLogger } from "./utils/structures/RawonLogger.js";

const logger = new RawonLogger({ prod: process.env.NODE_ENV !== "development" });
const tokens = getDiscordTokens();

if (tokens.length === 0) {
    logger.error("No Discord token(s) found. Please set DISCORD_TOKEN in your .env file.");
    process.exit(1);
}

// Create clients for each token
const clients: Rawon[] = tokens.map(() => new Rawon(clientOptions));

// Primary client reference (for queue state saving, etc.)
const primaryClient = clients[0];

async function saveAllQueueStates(): Promise<void> {
    const savePromises: Promise<void>[] = [];
    for (const [, guild] of primaryClient.guilds.cache) {
        if (guild.queue) {
            savePromises.push(guild.queue.saveQueueState());
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

// Log multi-client mode info
if (tokens.length > 1) {
    logger.info(`[MultiClient] Starting ${tokens.length} bot client(s) in unified mode...`);
}

// Build all clients sequentially (to avoid rate limits)
for (const [index, client] of clients.entries()) {
    const token = tokens[index];
    const label = tokens.length > 1 ? `[Client ${index + 1}] ` : "";

    await client.build(token, index).catch((error: unknown) => {
        logger.error(`${label}PROMISE_ERR:`, error);
    });

    if (client.user) {
        logger.info(
            `${label}${client.user.tag} logged in${index === 0 ? " (primary)" : " (secondary)"}`,
        );
    }
}

if (tokens.length > 1) {
    logger.info(`[MultiClient] All ${tokens.length} clients are ready.`);
}
