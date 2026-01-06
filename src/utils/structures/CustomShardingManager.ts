import { EventEmitter } from "node:events";
import { setTimeout } from "node:timers";
import { CustomShard, type ShardOptions, type ShardStatus } from "./CustomShard.js";
import { type RawonLogger } from "./RawonLogger.js";

export interface ShardingManagerOptions {
    file: string;
    totalShards: number | "auto";
    token: string;
    respawn?: boolean;
    logger: RawonLogger;
}

export class CustomShardingManager extends EventEmitter {
    public shards = new Map<number, CustomShard>();
    public totalShards: number;
    private readonly file: string;
    private readonly token: string;
    private readonly respawn: boolean;
    private readonly logger: RawonLogger;
    private isSpawning = false;

    public constructor(options: ShardingManagerOptions) {
        super();
        this.file = options.file;
        this.token = options.token;
        this.respawn = options.respawn ?? true;
        this.logger = options.logger;

        if (options.totalShards === "auto") {
            this.totalShards = 1;
        } else {
            this.totalShards = options.totalShards;
        }
    }

    public async spawn(shardIds?: number[]): Promise<void> {
        if (this.isSpawning) {
            this.logger.warn("[ShardingManager] Already spawning shards");
            return;
        }

        this.isSpawning = true;

        try {
            if (this.totalShards === 1 && shardIds === undefined) {
                this.logger.info(`[ShardingManager] Auto mode: Using ${this.totalShards} shard(s)`);
            }

            const idsToSpawn = shardIds ?? Array.from({ length: this.totalShards }, (_, i) => i);

            this.logger.info(`[ShardingManager] Spawning ${idsToSpawn.length} shard(s)...`);

            for (const shardId of idsToSpawn) {
                await this.createShard(shardId);
                await new Promise((resolve) => setTimeout(resolve, 5_000));
            }

            this.logger.info(
                `[ShardingManager] All ${idsToSpawn.length} shard(s) spawned successfully`,
            );
        } finally {
            this.isSpawning = false;
        }
    }

    private setupShardMessageHandlers(shard: CustomShard): void {
        shard.on("message", (message: any) => {
            if (message.type === "broadcastEval") {
                this.handleBroadcastEval(
                    message.evalId,
                    message.script,
                    message.shardId,
                    message.shard,
                    message.context,
                ).catch((error) => {
                    this.logger.error(`[ShardingManager] Broadcast eval error:`, error);
                });
            }
        });
    }

    private async handleBroadcastEval(
        evalId: string,
        script: string,
        requestingShardId: number,
        targetShards?: number | number[],
        context?: any,
    ): Promise<void> {
        const shardsToEval = targetShards
            ? Array.isArray(targetShards)
                ? targetShards
                : [targetShards]
            : Array.from(this.shards.keys());

        const promises: Promise<any>[] = [];

        for (const shardId of shardsToEval) {
            const shard = this.shards.get(shardId);
            if (shard) {
                promises.push(
                    shard.eval(script, context).catch((error) => {
                        this.logger.error(
                            `[ShardingManager] Eval error on shard #${shardId}:`,
                            error,
                        );
                        return error;
                    }),
                );
            }
        }

        const results = await Promise.all(promises);

        const requestingShard = this.shards.get(requestingShardId);
        if (requestingShard?.process?.connected) {
            requestingShard.send({
                type: "broadcastEvalResult",
                evalId,
                results,
            });
        } else {
            this.logger.warn(
                `[ShardingManager] Cannot send broadcastEval results to shard #${requestingShardId} - shard not found or not connected`,
            );
        }
    }

    private async createShard(shardId: number): Promise<void> {
        if (this.shards.has(shardId)) {
            this.logger.warn(`[ShardingManager] Shard #${shardId} already exists`);
            return;
        }

        const shardOptions: ShardOptions = {
            id: shardId,
            file: this.file,
            token: this.token,
            totalShards: this.totalShards,
            respawn: this.respawn,
            logger: this.logger,
        };

        const shard = new CustomShard(shardOptions);

        shard.on("ready", () => {
            this.emit("shardCreate", shard);
            this.emit("shardReady", shard);
        });

        shard.on("disconnect", () => {
            this.emit("shardDisconnect", shard);
        });

        shard.on("reconnecting", () => {
            this.emit("shardReconnecting", shard);
        });

        shard.on("error", (error) => {
            this.emit("shardError", shard, error);
        });

        shard.on("death", (data) => {
            this.emit("shardDeath", shard, data);
        });

        this.setupShardMessageHandlers(shard);

        this.shards.set(shardId, shard);

        try {
            await shard.spawn();
        } catch (error) {
            this.logger.error(`[ShardingManager] Failed to spawn shard #${shardId}:`, error);
            this.shards.delete(shardId);
            throw error;
        }
    }

    public broadcastEval<T = any>(
        script: string | ((client: any) => T),
    ): Promise<Array<T | Error>> {
        const promises: Promise<T | Error>[] = [];

        for (const shard of this.shards.values()) {
            promises.push(
                shard.eval<T>(script).catch((error) => {
                    this.logger.error(`[ShardingManager] Eval error on shard #${shard.id}:`, error);
                    return error as Error;
                }),
            );
        }

        return Promise.all(promises);
    }

    public fetchClientValues<T = any>(prop: string): Promise<T[]> {
        return this.broadcastEval<T>((client) => {
            const props = prop.split(".");
            let value: any = client;

            for (const p of props) {
                value = value?.[p];
            }

            return value;
        }).then((results) => results.filter((r): r is T => !(r instanceof Error)));
    }

    public respawnAll(shardDelay = 5_000, respawnDelay = 500): Promise<void> {
        return new Promise((resolve) => {
            this.logger.info("[ShardingManager] Respawning all shards...");

            const shardIds = Array.from(this.shards.keys());
            let index = 0;

            const respawnNext = (): void => {
                if (index >= shardIds.length) {
                    this.logger.info("[ShardingManager] All shards respawned");
                    resolve();
                    return;
                }

                const shardId = shardIds[index++];
                const shard = this.shards.get(shardId);

                if (shard) {
                    shard.kill();
                    setTimeout(async () => {
                        try {
                            await this.createShard(shardId);
                            setTimeout(respawnNext, respawnDelay);
                        } catch (error) {
                            this.logger.error(
                                `[ShardingManager] Failed to respawn shard #${shardId}:`,
                                error,
                            );
                            setTimeout(respawnNext, respawnDelay);
                        }
                    }, shardDelay);
                } else {
                    setTimeout(respawnNext, respawnDelay);
                }
            };

            respawnNext();
        });
    }

    public async killAll(signal: NodeJS.Signals = "SIGTERM"): Promise<void> {
        this.logger.info("[ShardingManager] Killing all shards...");

        const killPromises: Promise<void>[] = [];

        for (const shard of this.shards.values()) {
            killPromises.push(
                new Promise((resolve) => {
                    shard.respawn = false;

                    if (shard.process) {
                        const exitHandler = (): void => {
                            resolve();
                        };

                        shard.process.once("exit", exitHandler);
                        shard.kill(signal);

                        setTimeout(() => {
                            shard.process?.removeListener("exit", exitHandler);
                            resolve();
                        }, 5_000);
                    } else {
                        resolve();
                    }
                }),
            );
        }

        await Promise.all(killPromises);
        this.shards.clear();
        this.logger.info("[ShardingManager] All shards killed");
    }

    public getShard(id: number): CustomShard | undefined {
        return this.shards.get(id);
    }

    public getAllShardStatuses(): ShardStatus[] {
        return Array.from(this.shards.values()).map((shard) => shard.getStatus());
    }

    public getTotalShards(): number {
        return this.totalShards;
    }

    public setTotalShards(totalShards: number): void {
        this.totalShards = totalShards;
    }
}
