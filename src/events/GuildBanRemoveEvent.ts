import { BaseEvent } from "../structures/BaseEvent";
import { Event } from "../utils/decorators/Event";
import { GuildBan } from "discord.js";

@Event("guildBanRemove")
export class GuildBanRemoveEvent extends BaseEvent {
    public execute(ban: GuildBan): void {
        void this.client.modlogs.handleBanRemove(ban);
    }
}
