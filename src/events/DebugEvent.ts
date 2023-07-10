import { BaseEvent } from "../structures/BaseEvent.js";
import { Event } from "../utils/decorators/Event.js";

@Event("debug")
export class DebugEvent extends BaseEvent {
    public execute(message: string): void {
        this.client.logger.debug(message);
    }
}
