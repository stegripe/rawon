import { BotClient } from "../../structures/BotClient.js";
import { Event } from "../../typings/index.js";
import { readdirSync } from "node:fs";
import { resolve } from "node:path";

export class EventLoader {
    public constructor(public readonly client: BotClient) {}

    public async readFromDir(dir: string): Promise<void> {
        this.client.logger.info(`Loading events from "${dir}"...`);

        const events = readdirSync(dir);
        this.client.logger.info("Loading %d events...", events.length);

        for (const file of events) {
            const event = await this.client.utils.importClass<Event>(
                resolve(dir, file),
                this.client
            );

            if (!event) throw new Error(`File ${file} is not a valid event file.`);

            this.client.on(event.name as string, event.execute.bind(event));
            this.client.logger.info(`${event.name as string} event has been loaded.`);
        }

        this.client.logger.info("Done loading events");
    }
}
