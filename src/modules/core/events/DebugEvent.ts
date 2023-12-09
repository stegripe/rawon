import { BaseEvent } from "#rawon/structures/BaseEvent.js";
import { Event } from "#rawon/utils/decorators/Event.js";

@Event("debug")
export class DebugEvent extends BaseEvent {
    public execute(message: string): void {
        this.client.logger.debug(message);
    }
}
