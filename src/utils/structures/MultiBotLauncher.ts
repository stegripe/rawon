import process from "node:process";
import { clientOptions, discordTokens, isMultiBot, isProd } from "../../config/index.js";
import { Rawon } from "../../structures/Rawon.js";
import { MultiBotManager } from "./MultiBotManager.js";
import { NoStackError } from "./NoStackError.js";
import { RawonLogger } from "./RawonLogger.js";

const log = new RawonLogger({ prod: isProd });

export class MultiBotLauncher {
    private readonly clients: Rawon[] = [];
    private readonly multiBotManager = MultiBotManager.getInstance();

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

    private async createBotInstance(
        token: string,
        tokenIndex: number,
        options: typeof clientOptions,
    ): Promise<Rawon> {
        const client = new Rawon(options);
        client.on("clientReady", () => {
            log.info(
                `[MultiBot] Bot #${tokenIndex} (${client.user?.tag}) is ready! (${client.guilds.cache.size} guilds)`,
            );

            for (const guild of client.guilds.cache.values()) {
                const member = guild.members.cache.get(client.user!.id);
                log.debug(
                    `[MultiBot] Bot #${tokenIndex} (${client.user?.tag}) is in guild ${guild.name} (${guild.id}), member cached: ${member !== undefined}`,
                );
            }
        });

        client.on("error", (error) => {
            log.error(`[MultiBot] Bot #${tokenIndex} error:`, error);
        });

        client.on("warn", (warning) => {
            log.warn(`[MultiBot] Bot #${tokenIndex} warning:`, warning);
        });
        await client.build(token);
        if (client.user) {
            this.multiBotManager.registerBot(client, tokenIndex, client.user.id);
            log.info(
                `[MultiBot] Registered bot instance ${client.user.tag} (${client.user.id}) at index ${tokenIndex}`,
            );
        }

        return client;
    }

    public async start(): Promise<void> {
        this.setupProcessHandlers();

        if (!isMultiBot || discordTokens.length <= 1) {
            const token = discordTokens[0] ?? process.env.DISCORD_TOKEN;
            if (!token) {
                log.error("[FATAL] DISCORD_TOKEN is not set!");
                process.exit(1);
            }

            const client = await this.createBotInstance(token, 0, clientOptions);
            this.clients.push(client);
            log.info("[MultiBot] Single bot mode - Started 1 bot instance.");
            return;
        }
        log.info(`[MultiBot] Starting ${discordTokens.length} bot instances...`);

        for (let i = 0; i < discordTokens.length; i++) {
            const token = discordTokens[i];

            if (!token) {
                log.warn(`[MultiBot] Token #${i} is empty, skipping...`);
                continue;
            }

            try {
                const client = await this.createBotInstance(token, i, clientOptions);
                this.clients.push(client);
            } catch (error: unknown) {
                log.error(`[MultiBot] Error starting bot #${i}:`, error);
                throw error;
            }
        }

        log.info(`[MultiBot] Successfully started ${this.clients.length} bot instances!`);
    }

    public getClients(): Rawon[] {
        return this.clients;
    }

    public async shutdown(): Promise<void> {
        log.info("[MultiBot] Shutting down all bot instances...");
        await this.saveAllQueueStates();

        const destroyPromises = this.clients.map(async (client) => {
            try {
                return await client.destroy();
            } catch (error) {
                log.error(`[MultiBot] Error destroying client:`, error);
            }
        });

        await Promise.all(destroyPromises);
        log.info("[MultiBot] All bot instances shut down.");
    }
}
