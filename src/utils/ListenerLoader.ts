import { promises as fs } from "fs";
import { parse, resolve } from "path";
import { Disc_11 } from "../structures/Disc_11";
import { IListener } from "../../typings";

export class ListenerLoader {
    public constructor(public client: Disc_11, public readonly path: string) {}

    public async load(): Promise<Disc_11> {
        const files: string[] | undefined = await fs.readdir(resolve(this.path));
        for (const file of files) {
            const event = await this.import(resolve(this.path, file), this.client);
            if (event === undefined) throw new Error(`File ${file} is not a valid listener file`);
            this.client.on(event.name, (...args) => event.execute(...args));
            this.client.logger.info(`${this.client.shard ? `[Shard #${this.client.shard.ids[0]}]` : ""} Listener for event ${event.name} has been loaded!`);
        }
        this.client.logger.info(`${this.client.shard ? `[Shard #${this.client.shard.ids[0]}]` : ""} A total of ${files.length} of listeners has been loaded!`);
        return this.client;
    }

    private async import(path: string, ...args: any[]): Promise<IListener | undefined> {
        const file = (await import(resolve(path)).then(m => m[parse(path).name]));
        return file ? new file(...args) : undefined;
    }
}
