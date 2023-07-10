import { BaseLogger, LogLevel } from "./RawonLogger.js";

export class DebugLogManager extends BaseLogger {
    public constructor(public readonly logEnabled: boolean, dev = true) {
        super(dev);
    }

    public logData(level: LogLevel, contextName: string, data: string[][] | string): void {
        if (!this.logEnabled) return;
        const messages: string[] = [`[${contextName}]`];

        if (Array.isArray(data)) {
            for (const [key, value] of data) {
                messages.push(`${key.trim() ? `${key}: ` : ""}${value}`);
            }
        } else {
            messages.push(data);
        }

        this.log([`${messages.join("\n")}\n`], level);
    }
}
