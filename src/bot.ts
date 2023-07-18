import { NoStackError } from "./utils/structures/NoStackError.js";
import { clientOptions } from "./config/index.js";
import { Rawon } from "./structures/Rawon.js";

const client = new Rawon(clientOptions);

process
    .on("exit", code => client.logger.info(`NodeJS process exited with code ${code}`))
    .on("unhandledRejection", reason =>
        client.logger.error(
            "UNHANDLED_REJECTION:",
            (reason as Error).stack ? reason : new NoStackError(reason as string)
        )
    )
    .on("warning", (...args) => client.logger.warn(...args))
    .on("uncaughtException", err => {
        client.logger.error("UNCAUGHT_EXCEPTION:", err);
        client.logger.warn("Uncaught Exception detected, trying to restart...");
        process.exit(1);
    });

client.build().catch(e => client.logger.error("PROMISE_ERR:", e));
