import { BaseEvent } from "../structures/BaseEvent";
import { Event } from "../utils/decorators/Event";
import { GuildBan } from "discord.js";

@Event("guildBanAdd")
export class GuildBanAddEvent extends BaseEvent {
    public execute(ban: GuildBan): void {
        void this.client.modlogs.handleBanAdd(ban);
    }
}
