import { DefineListener } from "../utils/decorators/DefineListener";
import { BaseListener } from "../structures/BaseListener";

@DefineListener("warn")
export class WarnEvent extends BaseListener {
    public execute(warn: string): void {
        this.client.logger.warn("CLIENT_WARN:", warn);
    }
}
