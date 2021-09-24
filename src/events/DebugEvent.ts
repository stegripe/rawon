import { DefineEvent } from "../utils/decorators/DefineEvent";
import { BaseEvent } from "../structures/BaseEvent";

@DefineEvent("debug")
export class DebugEvent extends BaseEvent {
    public execute(message: string): void {
        this.client.logger.debug(message);
    }
}
