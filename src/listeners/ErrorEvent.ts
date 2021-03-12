import { BaseListener } from "../structures/BaseListener";
import { DefineListener } from "../utils/decorators/DefineListener";

@DefineListener("error")
export class ErrorEvent extends BaseListener {
    public execute(error: string): void {
        this.client.logger.error("CLIENT_ERROR:", error);
    }
}
