import { BaseEvent } from "../structures/BaseEvent.js";
import { Event } from "../utils/decorators/Event.js";

@Event("warn")
export class WarnEvent extends BaseEvent {
    public execute(warn: string): void {
        this.client.logger.warn("CLIENT_WARN:", warn);
    }
}
