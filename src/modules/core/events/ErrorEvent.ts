import { BaseEvent } from "#rawon/structures/BaseEvent.js";
import { Event } from "#rawon/utils/decorators/Event.js";

@Event("error")
export class ErrorEvent extends BaseEvent {
    public execute(error: string): void {
        this.client.logger.error("CLIENT_ERROR:", error);
    }
}
