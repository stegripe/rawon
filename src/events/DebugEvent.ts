import { BaseEvent } from "../structures/BaseEvent";
import { Event } from "../utils/decorators/Event";

@Event("debug")
export class DebugEvent extends BaseEvent {
    public execute(message: string): void {
        this.client.logger.debug(message);
    }
}
