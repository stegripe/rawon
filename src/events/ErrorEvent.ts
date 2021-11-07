import { BaseEvent } from "../structures/BaseEvent";

export class ErrorEvent extends BaseEvent {
    public constructor(client: BaseEvent["client"]) {
        super(client, "error");
    }

    public execute(error: string): void {
        this.client.logger.error("CLIENT_ERROR:", error);
    }
}
