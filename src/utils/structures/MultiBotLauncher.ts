import process from "node:process";
import type { ClientOptions } from "discord.js";
import {
    discordIds,
    discordTokens,
    isMultiBot,
    isProd,
    shardsCount,
} from "../../config/index.js";
import { clientOptions } from "../../config/index.js";
import { Rawon } from "../../structures/Rawon.js";
import { RawonLogger } from "./RawonLogger.js";
import { MultiBotManager } from "./MultiBotManager.js";
import { NoStackError } from "./NoStackError.js";

const log = new RawonLogger({ prod: isProd });

/**
 * Custom multi-bot launcher that creates multiple Client instances directly
 * without using ShardingManager. More control and cleaner implementation.
 */
export class MultiBotLauncher {
    private readonly clients: Rawon[] = [];
    private readonly multiBotManager = MultiBotManager.getInstance();

    /**
     * Save all queue states from all bot instances
     */
    private async saveAllQueueStates(): Promise<void> {
        const savePromises: Promise<void>[] = [];
        for (const client of this.clients) {
            for (const [, guild] of client.guilds.cache) {
                if (guild.queue) {
                    savePromises.push(guild.queue.saveQueueState());
                }
            }
        }
        await Promise.all(savePromises);
    }

    /**
     * Setup process event handlers
     */
    private setupProcessHandlers(): void {
        process.on("SIGINT", async () => {
            log.info("Received SIGINT, saving queue states before exit...");
            await this.saveAllQueueStates();
            process.exit(0);
        });

        process.on("SIGTERM", async () => {
            log.info("Received SIGTERM, saving queue states before exit...");
            await this.saveAllQueueStates();
            process.exit(0);
        });

        process
            .on("exit", (code) => log.info(`NodeJS process exited with code ${code}`))
            .on("unhandledRejection", (reason) =>
                log.error(
                    "UNHANDLED_REJECTION:",
                    ((reason as Error).stack?.length ?? 0)
                        ? reason
                        : new NoStackError(reason as string),
                ),
            )
            .on("warning", (...args) => log.warn(...args))
            .on("uncaughtException", (err) => {
                log.error("UNCAUGHT_EXCEPTION:", err);
                log.warn("Uncaught Exception detected, trying to restart...");
                process.exit(1);
            });
    }

    /**
     * Create and start a single bot instance
     */
    private async createBotInstance(
        token: string,
        tokenIndex: number,
        botId: string,
        options: ClientOptions,
    ): Promise<Rawon> {
        const client = new Rawon(options);

        // Setup event handlers for this client
        client.on("ready", () => {
            log.info(
                `[MultiBot] Bot #${tokenIndex} (${client.user?.tag}) is ready! (${client.guilds.cache.size} guilds)`,
            );
            
            // Log guild memberships for debugging
            client.guilds.cache.forEach((guild) => {
                const member = guild.members.cache.get(client.user!.id);
                log.debug(
                    `[MultiBot] Bot #${tokenIndex} (${client.user?.tag}) is in guild ${guild.name} (${guild.id}), member cached: ${member !== undefined}`,
                );
            });
        });

        client.on("error", (error) => {
            log.error(`[MultiBot] Bot #${tokenIndex} error:`, error);
        });

        client.on("warn", (warning) => {
            log.warn(`[MultiBot] Bot #${tokenIndex} warning:`, warning);
        });

        // Build and login
        await client.build(token);

        // Register in MultiBotManager after login
        if (client.user) {
            this.multiBotManager.registerBot(client, tokenIndex, client.user.id);
            log.info(
                `[MultiBot] Registered bot instance ${client.user.tag} (${client.user.id}) at index ${tokenIndex}`,
            );
        }

        return client;
    }

    /**
     * Start all bot instances
     */
    public async start(): Promise<void> {
        this.setupProcessHandlers();

        if (!isMultiBot || discordTokens.length <= 1) {
            // Single bot mode - use first token
            const token = discordTokens[0] ?? process.env.DISCORD_TOKEN;
            if (!token) {
                log.error("[FATAL] DISCORD_TOKEN is not set!");
                process.exit(1);
            }

            const client = await this.createBotInstance(token, 0, discordIds[0] ?? "", clientOptions);
            this.clients.push(client);
            log.info("[MultiBot] Single bot mode - Started 1 bot instance.");
            return;
        }

        // Multi-bot mode
        log.info(`[MultiBot] Starting ${discordTokens.length} bot instances...`);

        const startPromises: Promise<Rawon>[] = [];

        for (let i = 0; i < discordTokens.length; i++) {
            const token = discordTokens[i];
            const botId = discordIds[i] ?? "";

            if (!token) {
                log.warn(`[MultiBot] Token #${i} is empty, skipping...`);
                continue;
            }

            // Create bot instance (all can run concurrently)
            startPromises.push(this.createBotInstance(token, i, botId, clientOptions));
        }

        // Wait for all bots to start
        try {
            const clients = await Promise.all(startPromises);
            this.clients.push(...clients);
            log.info(
                `[MultiBot] Successfully started ${this.clients.length} bot instances!`,
            );
        } catch (error: unknown) {
            log.error("[MultiBot] Error starting bot instances:", error);
            throw error;
        }
    }

    /**
     * Get all running clients
     */
    public getClients(): Rawon[] {
        return this.clients;
    }

    /**
     * Shutdown all bot instances gracefully
     */
    public async shutdown(): Promise<void> {
        log.info("[MultiBot] Shutting down all bot instances...");
        await this.saveAllQueueStates();

        const destroyPromises = this.clients.map((client) => {
            try {
                client.destroy();
            } catch (error) {
                log.error(`[MultiBot] Error destroying client:`, error);
            }
        });

        await Promise.all(destroyPromises);
        log.info("[MultiBot] All bot instances shut down.");
    }
}

