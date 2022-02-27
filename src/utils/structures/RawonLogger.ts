import { RawonLoggerOptions } from "../../typings";
import { format } from "date-fns";

enum ANSIColorOpening {
    Red = "\x1b[31m",
    Yellow = "\x1b[33m",
    Green = "\x1b[32m",
    Blue = "\x1b[34m"
}

const ansiColorClosing = "\x1b[39m";

export type LogLevel = "debug" | "error" | "info" | "warn";

const levelColors: Record<LogLevel, string> = {
    debug: ANSIColorOpening.Blue,
    error: ANSIColorOpening.Red,
    info: ANSIColorOpening.Green,
    warn: ANSIColorOpening.Yellow
};

export class RawonLogger {
    public constructor(public readonly options: RawonLoggerOptions) {}

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

    private log(messages: any[], level: LogLevel = "info"): void {
        if (this.options.prod && level === "debug") return;

        const opening = this.options.prod ? "" : levelColors[level];
        const closing = this.options.prod ? "" : ansiColorClosing;
        const formattedDate = format(Date.now(), "yyyy-MM-dd HH:mm:ss (x)");
        const message = messages.map(x => String(x)).join(" ");

        console[level](`${opening}[${formattedDate}] [${level}]: ${message} ${closing}`);
    }
}
