import { IRawonLoggerOptions } from "../typings";
import { format } from "date-fns";

enum Colors {
    Reset = "\x1b[0m",
    Red = "\x1b[31m",
    Yellow = "\x1b[33m",
    Green = "\x1b[32m",
    Blue = "\x1b[34m"
}

export class RawonLogger {
    public constructor(public readonly options: IRawonLoggerOptions) {}

    public info(...messages: any[]): void {
        this.log(messages, "info");
    }

    public debug(...messages: any[]): void {
        this.log(messages, "debug");
    }

    public error(...messages: any[]): void {
        this.log(messages, "error");
    }

    public warn(...messages: any[]): void {
        this.log(messages, "warn");
    }

    private log(messages: any[], level: "debug" | "error" | "info" | "warn" = "info"): void {
        if (this.options.prod && level === "debug") return;

        // eslint-disable-next-line no-nested-ternary
        console[level](`${this.options.prod ? "" : level === "debug" ? Colors.Blue : level === "error" ? Colors.Red : level === "warn" ? Colors.Yellow : Colors.Green}[${format(Date.now(), "yyyy-MM-dd HH:mm:ss (x)")}] [${level}]: ${messages.map(x => String(x)).join(" ")} ${Colors.Reset}`);
    }
}
