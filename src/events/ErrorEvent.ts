import { BaseEvent } from "../structures/BaseEvent";
import { Event } from "../utils/decorators/Event";

@Event("error")
export class ErrorEvent extends BaseEvent {
    public execute(error: string): void {
        this.client.logger.error("CLIENT_ERROR:", error);
    }
}
