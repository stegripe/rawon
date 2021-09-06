import { Disc } from "../structures/Disc";
import { IEvent } from "../typings";
import { parse, resolve } from "path";
import { promises as fs } from "fs";

export class EventsLoader {
    public constructor(public client: Disc, public readonly path: string) {}

    public async load(): Promise<Disc> {
        const files: string[] | undefined = await fs.readdir(resolve(this.path));
        for (const file of files) {
            const event = await this.import(resolve(this.path, file), this.client);
            if (event === undefined) throw new Error(`File ${file} is not a valid event file.`);
            this.client.on(event.name, (...args) => event.execute(...args));
            this.client.logger.info(`${this.client.shard ? `[Shard #${this.client.shard.ids[0]}]` : ""} Event for listener ${event.name} has been loaded.`);
        }
        this.client.logger.info(`${this.client.shard ? `[Shard #${this.client.shard.ids[0]}]` : ""} A total of ${files.length} of events has been loaded.`);
        return this.client;
    }

    private async import(path: string, ...args: any[]): Promise<IEvent | undefined> {
        const file = (await import(resolve(path)).then(m => m[parse(path).name]));
        return file ? new file(...args) : undefined;
    }
}
