import { Disc } from "../structures/Disc";
import { Guild, Role } from "discord.js";

export class ClientUtils {
    public constructor(public readonly client: Disc) {}

    public async fetchMuteRole(guild: Guild): Promise<Role> {
        return guild.roles.cache.find(x => x.name === this.client.config.muteRoleName) ?? guild.roles.create({
            mentionable: false,
            name: this.client.config.muteRoleName,
            permissions: ["VIEW_CHANNEL", "READ_MESSAGE_HISTORY"],
            reason: "Create mute role"
        });
    }

    public decode(string: string): string {
        return Buffer.from(string, "base64").toString("ascii");
    }
}
