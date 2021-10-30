import { Disc } from "../structures/Disc";
import { IEvent } from "../typings";
import { promises as fs } from "fs";
import { resolve } from "path";

export class EventsLoader {
    public constructor(public client: Disc, public path: string) {}
    public load(): void {
        fs.readdir(resolve(this.path))
            .then(async events => {
                this.client.logger.info(`Loading ${events.length} events...`);
                for (const file of events) {
                    const event = await this.client.utils.import<IEvent>(resolve(this.path, file), this.client);
                    if (event === undefined) throw new Error(`File ${file} is not a valid event file.`);
                    this.client.logger.info(`Events on listener ${event.name.toString()} has been added.`);
                    this.client.on(event.name, (...args) => event.execute(...args));
                }
            })
            .catch(err => this.client.logger.error("EVENTS_LOADER_ERR:", err))
            .finally(() => this.client.logger.info("Done loading events."));
    }
}
