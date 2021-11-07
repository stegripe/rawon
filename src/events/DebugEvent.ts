import { BaseEvent } from "../structures/BaseEvent";

export class DebugEvent extends BaseEvent {
    public constructor(client: BaseEvent["client"]) {
        super(client, "debug");
    }

    public execute(message: string): void {
        this.client.logger.debug(message);
    }
}
