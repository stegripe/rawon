import { BaseEvent } from "../structures/BaseEvent";
import { Event } from "../utils/decorators/Event";

@Event("warn")
export class WarnEvent extends BaseEvent {
    public execute(warn: string): void {
        this.client.logger.warn("CLIENT_WARN:", warn);
    }
}
