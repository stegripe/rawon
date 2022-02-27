import { BaseLogger, LogLevel } from "./RawonLogger";

export class DebugLogManager extends BaseLogger {
    public constructor(prod = true) {
        super(prod);
    }

    public logData(level: LogLevel, contextName: string, data: string[][] | string): void {
        const messages: string[] = [`[${contextName}]`];

        if (Array.isArray(data)) {
            for (const [key, value] of data) {
                messages.push(`${key.trim() ? `${key}: ` : ""}${value}`);
            }
        } else {
            messages.push(data);
        }

        this.log(messages, level);
    }
}
