import { ApplyOptions } from "@sapphire/decorators";
import { Events, Listener, type ListenerOptions } from "@sapphire/framework";

@ApplyOptions<ListenerOptions>({
    event: Events.Warn,
})
export class WarnListener extends Listener<typeof Events.Warn> {
    public run(info: string): void {
        this.container.logger.warn(info, "CLIENT_WARN");
    }
}
