import { promises as fs } from "node:fs";
import nodePath from "node:path";
import { type Rawon } from "../../structures/Rawon.js";
import { type Event } from "../../typings/index.js";
import { pathStringToURLString } from "../functions/pathStringToURLString.js";

export class EventsLoader {
    public constructor(
        public client: Rawon,
        public path: string,
    ) {}
    public load(): void {
        (async () => {
            await fs
                .readdir(nodePath.resolve(this.path))
                .then(async (events) => {
                    this.client.logger.info(`Loading ${events.length} events...`);
                    for (const file of events) {
                        const event = await this.client.utils.import<Event>(
                            pathStringToURLString(nodePath.resolve(this.path, file)),
                            this.client,
                        );
                        if (event === undefined) {
                            throw new Error(`File ${file} is not a valid event file.`);
                        }
                        this.client.logger.info(
                            `Events on listener ${event.name.toString()} has been added.`,
                        );
                        this.client.on(event.name, (...args) => event.execute(...args));
                    }
                    return 0;
                })
                .catch((error: unknown) => this.client.logger.error("EVENTS_LOADER_ERR:", error))
                .finally(() => this.client.logger.info("Done loading events."));
        })();
    }
}
