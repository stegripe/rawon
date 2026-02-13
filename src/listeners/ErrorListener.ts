import { ApplyOptions } from "@sapphire/decorators";
import { Events, Listener, type ListenerOptions } from "@sapphire/framework";

@ApplyOptions<ListenerOptions>({
    event: Events.Error,
})
export class ErrorListener extends Listener<typeof Events.Error> {
    public run(error: Error): void {
        this.container.logger.error("CLIENT_ERROR:", error);
    }
}
