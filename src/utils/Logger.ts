import winston from "winston";
import { format } from "date-fns";

export function createLogger(serviceName: string, debug = false): winston.Logger {
    const logger = winston.createLogger({
        defaultMeta: {
            serviceName
        },
        format: winston.format.combine(
            winston.format.printf(info => {
                const { level, message, stack } = info;
                const prefix = `[${format(Date.now(), "yyyy-MM-dd HH:mm:ss (x)")}] [${level}]`;
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
            new winston.transports.File({ filename: `logs/${serviceName}/error-${format(Date.now(), "yyyy-MM-dd-HH-mm-ss")}.log`, level: "error" }),
            new winston.transports.File({ filename: `logs/${serviceName}/logs-${format(Date.now(), "yyyy-MM-dd-HH-mm-ss")}.log` })
        ]
    });
    logger.add(new winston.transports.Console({
        level: debug ? "debug" : "info",
        format: winston.format.combine(
            winston.format.printf(info => {
                const { level, message, stack } = info;
                const prefix = `[${format(Date.now(), "yyyy-MM-dd HH:mm:ss (x)")}] [${level}]`;
                if (["error", "alert"].includes(level)) return `${prefix}: ${stack}`;
                return `${prefix}: ${message}`;
            }),
            winston.format.align(),
            winston.format.colorize({ all: true })
        )
    }));
    return logger;
}
