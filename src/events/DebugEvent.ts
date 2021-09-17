import { BaseEvent } from "../structures/BaseEvent";
import { DefineEvent } from "../utils/decorators/DefineEvent";

@DefineEvent("debug")
export class DebugEvent extends BaseEvent {
    public execute(message: string): void {
        this.client.logger.debug(message);
    }
}
