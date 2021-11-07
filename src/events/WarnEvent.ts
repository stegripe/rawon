import { BaseEvent } from "../structures/BaseEvent";

export class WarnEvent extends BaseEvent {
    public constructor(client: BaseEvent["client"]) {
        super(client, "warn");
    }

    public execute(warn: string): void {
        this.client.logger.warn("CLIENT_WARN:", warn);
    }
}
