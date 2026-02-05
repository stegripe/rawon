import { ApplyOptions } from "@sapphire/decorators";
import {
    Events,
    Listener,
    type ListenerErrorPayload,
    type ListenerOptions,
} from "@sapphire/framework";

@ApplyOptions<ListenerOptions>({
    event: Events.ListenerError,
})
export class ListenerErrorListener extends Listener<typeof Events.ListenerError> {
    public run(error: Error, payload: ListenerErrorPayload): void {
        // Suppress CoreReady errors in multi-bot mode
        // These happen because container.client.application is null during startup
        // This is expected behavior and doesn't affect functionality
        if (
            payload.piece.name === "CoreReady" &&
            error.message.includes("Cannot read properties of null")
        ) {
            this.container.logger.debug(
                "[ListenerError] Suppressed expected CoreReady error in multi-bot mode",
            );
            return;
        }

        // For all other listener errors, log them
        this.container.logger.error(
            `Listener error in "${payload.piece.name}" for event "${String(payload.piece.event)}"`,
            error,
        );
    }
}
