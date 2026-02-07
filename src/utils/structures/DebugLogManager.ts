import { createScopedLogger, type Logger } from "./createLogger.js";

export type DebugLogLevel = "debug" | "error" | "info" | "warn";

export class DebugLogManager {
    private readonly logger: Logger;

    public constructor(
        public readonly logEnabled: boolean,
        production = false,
    ) {
        this.logger = createScopedLogger("Debug", production);
    }

    public logData(level: DebugLogLevel, contextName: string, data: string[][] | string): void {
        if (!this.logEnabled) {
            return;
        }
        const messages: string[] = [`[${contextName}]`];

        if (Array.isArray(data)) {
            for (const [key, value] of data) {
                messages.push(`${key.trim() ? `${key}: ` : ""}${value}`);
            }
        } else {
            messages.push(data);
        }

        const message = `${messages.join("\n")}\n`;

        switch (level) {
            case "debug":
                this.logger.debug(message);
                break;
            case "info":
                this.logger.info(message);
                break;
            case "warn":
                this.logger.warn(message);
                break;
            default:
                this.logger.error(message);
                break;
        }
    }
}
