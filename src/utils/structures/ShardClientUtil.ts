import process from "node:process";
import { clearTimeout, setTimeout } from "node:timers";
import { type Rawon } from "../../structures/Rawon.js";

export class ShardClientUtil {
    public readonly client: Rawon;
    public readonly ids: number[];
    public readonly count: number;
    public readonly id: number;

    public constructor(client: Rawon) {
        this.client = client;
        this.id = parseInt(process.env.SHARD_ID ?? "0", 10);
        this.count = parseInt(process.env.SHARD_COUNT ?? "1", 10);
        this.ids = Array.from({ length: this.count }, (_, i) => i);
    }

    public async broadcastEval<T = any>(
        script: string | ((client: Rawon, context?: any) => T),
        options?: { shard?: number | number[]; context?: any },
    ): Promise<T[]> {
        if (process.send) {
            return new Promise((resolve, reject) => {
                const scriptString = typeof script === "function" ? script.toString() : script;
                const evalId = `broadcast-${Date.now()}-${Math.random()}`;
                const timeout = setTimeout(() => {
                    reject(new Error("Broadcast eval timeout"));
                }, 60_000);

                const messageHandler = (message: any): void => {
                    if (message.type === "broadcastEvalResult" && message.evalId === evalId) {
                        clearTimeout(timeout);
                        process.removeListener("message", messageHandler);

                        if (message.error) {
                            reject(new Error(message.error));
                        } else {
                            const results = Array.isArray(message.results)
                                ? message.results
                                : [message.results];
                            resolve(results);
                        }
                    }
                };

                process.on("message", messageHandler);

                process.send?.({
                    type: "broadcastEval",
                    evalId,
                    script: scriptString,
                    shardId: this.id,
                    shard: options?.shard,
                    context: options?.context,
                });
            });
        }

        try {
            let result: T;
            if (typeof script === "function") {
                result = await script(this.client, options?.context);
            } else {
                result = await eval(`(async () => { ${script} })()`);
            }
            return [result];
        } catch (error) {
            throw new Error(String(error));
        }
    }

    public async fetchClientValues<T = any>(prop: string): Promise<T[]> {
        return this.broadcastEval<T>((client) => {
            const props = prop.split(".");
            let value: any = client;

            for (const p of props) {
                value = value?.[p];
            }

            return value;
        });
    }

    public send(message: any): boolean {
        if (!process.send) {
            return false;
        }

        try {
            process.send({
                ...message,
                shardId: this.id,
            });
            return true;
        } catch {
            return false;
        }
    }
}
