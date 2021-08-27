import { DefineEvent } from "../utils/decorators/DefineEvent";
import { BaseEvent } from "../structures/BaseEvent";

@DefineEvent("ready")
export class ReadyEvent extends BaseEvent {
    public execute(): void {
        this.client.logger.info(
            `${this.client.shard ? `[Shard #${this.client.shard.ids[0]}]` : ""} I'm ready to serve ${this.client.guilds.cache.size} guilds ` +
            `with ${this.client.channels.cache.filter(c => c.type === "GUILD_TEXT").size} text channels and ` +
            `${this.client.channels.cache.filter(c => c.type === "GUILD_VOICE").size} voice channels`
        );
        this.doPresence();
    }

    private doPresence(): void {
        this.client.util.updatePresence()
            .then(() => setInterval(() => this.client.util.updatePresence(), 30 * 1000))
            .catch(e => {
                if (e.message === "Shards are still being spawned.") return this.doPresence();
                this.client.logger.error("DO_PRESENCE_ERR:", e);
            });
        return undefined;
    }
}
