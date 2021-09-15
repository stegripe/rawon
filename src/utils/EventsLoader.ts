import { Disc } from "../structures/Disc";
import { IEvent } from "../typings";
import { parse, resolve } from "path";
import { promises as fs } from "fs";

export class EventsLoader {
    public constructor(public client: Disc, public path: string) {}
    public load(): void {
        fs.readdir(resolve(this.path))
            .then(async events => {
                this.client.logger.info(`Loading ${events.length} events...`);
                for (const file of events) {
                    const event = await this.import(resolve(this.path, file), this.client);
                    if (event === undefined) throw new Error(`File ${file} is not a valid event file.`);
                    this.client.logger.info(`Events on listener ${event.name.toString()} has been added.`);
                    this.client.addListener(event.name, (...args) => event.execute(...args));
                }
            })
            .catch(err => this.client.logger.error("EVENTS_LOADER_ERR:", err))
            .finally(() => this.client.logger.info("Done loading events."));
    }

    private async import(path: string, ...args: any[]): Promise<IEvent | undefined> {
        const file = (await import(resolve(path)).then(m => m[parse(path).name]));
        return file ? new file(...args) : undefined;
    }
}
