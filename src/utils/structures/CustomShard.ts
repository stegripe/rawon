import { type ChildProcess, fork } from "node:child_process";
import { EventEmitter } from "node:events";
import process from "node:process";
import { clearTimeout, setTimeout } from "node:timers";
import { type RawonLogger } from "./RawonLogger.js";

export interface ShardOptions {
    id: number;
    file: string;
    token: string;
    totalShards: number;
    respawn?: boolean;
    logger: RawonLogger;
}

export interface ShardStatus {
    id: number;
    ready: boolean;
    process?: ChildProcess;
    lastHeartbeat?: number;
    uptime?: number;
}

export class CustomShard extends EventEmitter {
    public id: number;
    public ready = false;
    public process?: ChildProcess;
    public lastHeartbeat?: number;
    public uptime?: number;
    private readonly file: string;
    private readonly token: string;
    private readonly totalShards: number;
    private readonly logger: RawonLogger;
    private respawnTimeout?: NodeJS.Timeout;
    private readonly maxRespawnAttempts = 5;
    private respawnAttempts = 0;
    private _respawn: boolean;

    public constructor(options: ShardOptions) {
        super();
        this.id = options.id;
        this.file = options.file;
        this.token = options.token;
        this.totalShards = options.totalShards;
        this._respawn = options.respawn ?? true;
        this.logger = options.logger;
    }

    public get respawn(): boolean {
        return this._respawn;
    }

    public set respawn(value: boolean) {
        this._respawn = value;
        if (!value && this.respawnTimeout) {
            clearTimeout(this.respawnTimeout);
            this.respawnTimeout = undefined;
        }
    }

    public spawn(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this.process) {
                this.logger.warn(
                    `[Shard #${this.id}] Already spawned, killing existing process...`,
                );
                this.kill();
            }

            const env = {
                ...process.env,
                SHARD_ID: this.id.toString(),
                SHARD_COUNT: this.totalShards.toString(),
                DISCORD_TOKEN: this.token,
            };

            this.logger.info(`[Shard #${this.id}] Spawning shard process...`);
            this.process = fork(this.file, [], {
                env,
                cwd: process.cwd(),
                silent: false,
            });

            const startTime = Date.now();

            const messageHandler = (message: any): void => {
                if (message.type === "broadcastEval") {
                    this.emit("message", message);
                    return;
                }

                if (message.shardId !== this.id) {
                    return;
                }

                switch (message.type) {
                    case "ready": {
                        this.ready = true;
                        this.uptime = Date.now() - startTime;
                        this.respawnAttempts = 0;
                        this.logger.info(
                            `[Shard #${this.id}] Shard is ready (took ${this.uptime}ms)`,
                        );
                        this.emit("ready");
                        resolve();
                        break;
                    }
                    case "error": {
                        this.logger.error(`[Shard #${this.id}] Error:`, message.error);
                        this.emit("error", message.error);
                        if (!this.ready) {
                            reject(new Error(message.error));
                        }
                        break;
                    }
                    case "disconnect": {
                        this.ready = false;
                        this.logger.warn(`[Shard #${this.id}] Disconnected`);
                        this.emit("disconnect");
                        if (this._respawn) {
                            this.handleRespawn();
                        }
                        break;
                    }
                    case "reconnecting": {
                        this.logger.info(`[Shard #${this.id}] Reconnecting...`);
                        this.emit("reconnecting");
                        break;
                    }
                    case "heartbeat": {
                        this.lastHeartbeat = Date.now();
                        this.emit("heartbeat");
                        break;
                    }
                    case "eval": {
                        this.emit("eval", message);
                        break;
                    }
                    default: {
                        this.emit("message", message);
                        break;
                    }
                }
            };

            this.process.on("message", messageHandler);
            this.process.on("exit", (code, signal) => {
                this.ready = false;

                if (code !== 0 || signal !== null) {
                    this.logger.warn(
                        `[Shard #${this.id}] Process exited with code ${code} and signal ${signal}`,
                    );
                } else {
                    this.logger.info(`[Shard #${this.id}] Process exited gracefully`);
                }

                this.emit("death", { code, signal });

                if (this.respawn && code !== 0) {
                    this.handleRespawn();
                }
            });

            this.process.on("error", (error) => {
                this.logger.error(`[Shard #${this.id}] Process error:`, error);
                this.emit("error", error);
                if (!this.ready) {
                    reject(error);
                }
            });

            const timeout = setTimeout(() => {
                if (!this.ready) {
                    this.logger.error(`[Shard #${this.id}] Spawn timeout after 30 seconds`);
                    reject(new Error(`Shard #${this.id} failed to become ready within 30 seconds`));
                }
            }, 30_000);

            this.once("ready", () => {
                clearTimeout(timeout);
            });
        });
    }

    private handleRespawn(): void {
        if (this.respawnAttempts >= this.maxRespawnAttempts) {
            this.logger.error(
                `[Shard #${this.id}] Max respawn attempts (${this.maxRespawnAttempts}) reached. Not respawning.`,
            );
            return;
        }

        this.respawnAttempts++;
        const delay = Math.min(1000 * this.respawnAttempts, 30_000);

        this.logger.info(
            `[Shard #${this.id}] Respawn attempt ${this.respawnAttempts}/${this.maxRespawnAttempts} in ${delay}ms...`,
        );

        if (this.respawnTimeout) {
            clearTimeout(this.respawnTimeout);
        }

        this.respawnTimeout = setTimeout(() => {
            this.spawn().catch((error) => {
                this.logger.error(`[Shard #${this.id}] Respawn failed:`, error);
            });
        }, delay);
    }

    public kill(signal: NodeJS.Signals = "SIGTERM"): void {
        if (this.respawnTimeout) {
            clearTimeout(this.respawnTimeout);
            this.respawnTimeout = undefined;
        }

        if (this.process) {
            this.logger.info(`[Shard #${this.id}] Killing shard process...`);
            this.process.kill(signal);
            this.process = undefined;
            this.ready = false;
        }
    }

    public send(message: any): boolean {
        if (!this.process || !this.process.connected) {
            return false;
        }

        try {
            this.process.send({ ...message, shardId: this.id });
            return true;
        } catch (error) {
            this.logger.error(`[Shard #${this.id}] Failed to send message:`, error);
            return false;
        }
    }

    public eval<T = any>(
        script: string | ((client: any, context?: any) => T),
        context?: any,
    ): Promise<T> {
        return new Promise((resolve, reject) => {
            if (!this.process || !this.process.connected) {
                reject(new Error(`Shard #${this.id} is not connected`));
                return;
            }

            const scriptString = typeof script === "function" ? script.toString() : script;
            const evalId = `${this.id}-${Date.now()}-${Math.random()}`;

            const timeout = setTimeout(() => {
                this.removeListener("eval", handler);
                reject(new Error(`Eval timeout for shard #${this.id}`));
            }, 30_000);

            const handler = (message: any): void => {
                if (message.evalId === evalId) {
                    clearTimeout(timeout);
                    this.removeListener("eval", handler);

                    if (message.error) {
                        reject(new Error(message.error));
                    } else {
                        resolve(message.result);
                    }
                }
            };

            this.once("eval", handler);
            this.send({
                type: "eval",
                script: scriptString,
                evalId,
                context,
            });
        });
    }

    public getStatus(): ShardStatus {
        return {
            id: this.id,
            ready: this.ready,
            process: this.process,
            lastHeartbeat: this.lastHeartbeat,
            uptime: this.uptime,
        };
    }
}
