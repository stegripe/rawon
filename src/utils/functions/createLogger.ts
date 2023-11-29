import { pino } from "pino";

type ProcessType = { type: "manager" } | { type: "shard"; shardId: number };
type LoggerOptions = ProcessType & {
    name: string;
    dev?: boolean;
};

export const createLogger = (options: LoggerOptions): pino.Logger => pino({
    name: options.name,
    timestamp: true,
    level: options.dev ? "debug" : "info",
    formatters: {
        bindings: () => ({
            pid: options.type === "shard" ? `Shard #${options.shardId}` : "Manager"
        })
    }
});
