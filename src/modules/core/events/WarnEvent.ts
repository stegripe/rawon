import { BaseEvent } from "#rawon/structures/BaseEvent.js";
import { Event } from "#rawon/utils/decorators/Event.js";

@Event("warn")
export class WarnEvent extends BaseEvent {
    public execute(warn: string): void {
        this.client.logger.warn("CLIENT_WARN:", warn);
    }
}
