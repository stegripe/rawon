import winston from "winston";

const dateFormat = Intl.DateTimeFormat("en", { dateStyle: "short", timeStyle: "medium", hour12: false });

function formatDateForLogFile(date?: number | Date): string {
    const data = dateFormat.formatToParts(date);
    return `<year>-<month>-<day>-<hour>-<minute>-<second>`
        .replace(/<year>/g, data.find(({ type }) => type === "year")!.value)
        .replace(/<month>/g, data.find(({ type }) => type === "month")!.value)
        .replace(/<day>/g, data.find(({ type }) => type === "day")!.value)
        .replace(/<hour>/g, data.find(({ type }) => type === "hour")!.value)
        .replace(/<minute>/g, data.find(({ type }) => type === "minute")!.value)
        .replace(/<second>/g, data.find(({ type }) => type === "second")!.value);
}

export function createLogger(serviceName: string, debug = false): winston.Logger {
    const logger = winston.createLogger({
        defaultMeta: {
            serviceName
        },
        format: winston.format.combine(
            winston.format.printf(info => {
                const { level, message, stack } = info;
                const prefix = `[${dateFormat.format(Date.now())}] [${level}]`;
                if (["error", "crit"].includes(level)) return `${prefix}: ${stack}`;
                return `${prefix}: ${message}`;
            })
        ),
        level: debug ? "debug" : "info",
        levels: {
            alert: 1,
            debug: 5,
            error: 0,
            info: 4,
            notice: 3,
            warn: 2
        },
        transports: [
            new winston.transports.File({ filename: `logs/${serviceName}/error-${formatDateForLogFile(Date.now())}.log`, level: "error" }),
            new winston.transports.File({ filename: `logs/${serviceName}/logs-${formatDateForLogFile(Date.now())}.log` })
        ]
    });
    logger.add(new winston.transports.Console({
        level: debug ? "debug" : "info",
        format: winston.format.combine(
            winston.format.printf(info => {
                const { level, message, stack } = info;
                const prefix = `[${dateFormat.format(Date.now())}] [${level}]`;
                if (["error", "alert"].includes(level)) return `${prefix}: ${stack}`;
                return `${prefix}: ${message}`;
            }),
            winston.format.align(),
            winston.format.colorize({ all: true })
        )
    }));
    return logger;
}
