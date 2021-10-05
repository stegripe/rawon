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

    public async fetchDJRole(guild: Guild): Promise<Role> {
        return guild.roles.cache.find(x => x.name === this.client.config.djRoleName) ?? guild.roles.create({
            mentionable: false,
            name: this.client.config.djRoleName,
            permissions: ["SEND_MESSAGES", "CONNECT"],
            reason: "Create DJ role"
        });
    }

    public requiredVoters(memberAmount: number): number {
        return Math.round(memberAmount / 2);
    }

    public decode(string: string): string {
        return Buffer.from(string, "base64").toString("ascii");
    }
}
