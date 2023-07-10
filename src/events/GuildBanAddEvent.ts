import { BaseEvent } from "../structures/BaseEvent.js";
import { Event } from "../utils/decorators/Event.js";
import { GuildBan } from "discord.js";

@Event("guildBanAdd")
export class GuildBanAddEvent extends BaseEvent {
    public execute(ban: GuildBan): void {
        this.client.debugLog.logData("info", "GUILD_BAN_ADD", [
            ["User", `${ban.user.tag}(${ban.user.id})`],
            ["Guild", `${ban.guild.name}(${ban.guild.id})`],
            ["Reason", ban.reason ?? "[Not specified]"]
        ]);

        void this.client.modlogs.handleBanAdd({ ban });
    }
}
