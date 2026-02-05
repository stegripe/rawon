import { ApplyOptions } from "@sapphire/decorators";
import { Events, Listener, type ListenerOptions } from "@sapphire/framework";

@ApplyOptions<ListenerOptions>({
    event: Events.Debug,
})
export class DebugListener extends Listener<typeof Events.Debug> {
    public run(message: string): void {
        this.container.logger.debug(message);
    }
}
