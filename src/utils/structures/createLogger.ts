import process from "node:process";
import pino from "pino";

export type Logger = pino.Logger;

/**
 * Creates a scoped pino logger for standalone usage outside Sapphire client context.
 * Used by sharding manager, multi-bot launcher, and other entry-point code.
 */
export function createScopedLogger(scope: string, production = false): Logger {
    return pino({
        name: scope,
        level: production ? "info" : "debug",
        timestamp: true,
        formatters: {
            level: (label) => ({ level: label }),
            bindings: () => ({ pid: `Rawon@${process.pid}`, scope }),
        },
        ...(production
            ? {}
            : {
                  transport: {
                      target: "pino-pretty",
                      options: {
                          colorize: true,
                          translateTime: "SYS:yyyy-MM-dd HH:mm:ss",
                          ignore: "pid,hostname",
                      },
                  },
              }),
    });
}
