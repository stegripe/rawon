import { DefineListener } from "../utils/decorators/DefineListener";
import { BaseListener } from "../structures/BaseListener";

@DefineListener("error")
export class ErrorEvent extends BaseListener {
    public execute(error: string): void {
        this.client.logger.error("CLIENT_ERROR:", error);
    }
}
