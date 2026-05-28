import { type GuildMember } from "discord.js";

export function isMemberDeafened(member: GuildMember | null | undefined): boolean {
    return member?.voice.deaf === true;
}
