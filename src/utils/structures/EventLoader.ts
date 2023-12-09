import { BotClient } from "../../structures/BotClient.js";
import { Event } from "../../typings/index.js";
import { Collection } from "discord.js";
import { resolve } from "node:path";

export class EventLoader {
    public readonly events = new Collection<Event["name"], Event[]>();

    public constructor(public readonly client: BotClient) {}

    public async readFromDir(dir: string): Promise<void> {
        this.client.logger.info(`Loading events from "${dir}"...`);

        const events = this.client.utils.readDir(dir);
        this.client.logger.info("Loading %d events...", events.length);

        for (const file of events) {
            const event = await this.client.utils.importClass<Event>(
                resolve(dir, file),
                this.client
            );

            if (!event) throw new Error(`File ${file} is not a valid event file.`);

            this.add(event);
            this.client.logger.info(`${event.name as string} event has been loaded.`);
        }

        this.client.logger.info("Done loading events");
    }

    public add(event: Event): void {
        if (!this.events.has(event.name)) {
            this.client.on(event.name, (...args) => {
                for (const listener of this.events.get(event.name)!) {
                    void listener.execute(...args);
                }
            });
        }

        (this.events.get(event.name) ?? this.events.set(event.name, []).get(event.name))!.push(event);
    }
}
