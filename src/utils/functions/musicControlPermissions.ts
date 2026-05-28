import { type Guild, type GuildMember, PermissionFlagsBits } from "discord.js";
import { type Rawon } from "../../structures/Rawon.js";
import { type QueueSong } from "../../typings/index.js";

type RequesterSource = QueueSong | string | null | undefined;

type MusicPermissionOptions = {
    client: Rawon;
    guild: Guild;
    member: GuildMember | null | undefined;
    requesterIds?: Iterable<RequesterSource>;
};

function isDJEnabled(client: Rawon, guild: Guild): boolean {
    return client.data.data?.[guild.id]?.dj?.enable === true;
}

function normalizeRequesterIds(requesterIds: Iterable<RequesterSource> = []): string[] {
    const ids: string[] = [];

    for (const source of requesterIds) {
        if (typeof source === "string") {
            ids.push(source);
            continue;
        }

        const requesterId = source?.requester.id;
        if (requesterId) {
            ids.push(requesterId);
        }
    }

    return ids;
}

function hasOtherHumanListeners(member: GuildMember): boolean {
    const voiceChannel = member.voice.channel;
    if (!voiceChannel) {
        return true;
    }

    return voiceChannel.members.some(
        (voiceMember) => !voiceMember.user.bot && voiceMember.id !== member.id,
    );
}

async function hasElevatedMusicPermission({
    client,
    guild,
    member,
}: MusicPermissionOptions): Promise<boolean> {
    if (!member) {
        return false;
    }

    if (member.permissions.has(PermissionFlagsBits.ManageGuild)) {
        return true;
    }

    const djRole = await client.utils.fetchDJRole(guild).catch(() => null);
    return djRole !== null && member.roles.cache.has(djRole.id);
}

export async function hasMusicControlPermission({
    client,
    guild,
    member,
    requesterIds,
}: MusicPermissionOptions): Promise<boolean> {
    if (!member) {
        return false;
    }

    if (!isDJEnabled(client, guild)) {
        return true;
    }

    if (!hasOtherHumanListeners(member)) {
        return true;
    }

    if (await hasElevatedMusicPermission({ client, guild, member })) {
        return true;
    }

    return normalizeRequesterIds(requesterIds).includes(member.id);
}

export async function hasRemoveSelectionPermission({
    client,
    guild,
    member,
    songs,
}: Omit<MusicPermissionOptions, "requesterIds"> & { songs: QueueSong[] }): Promise<boolean> {
    if (!member) {
        return false;
    }

    if (!isDJEnabled(client, guild)) {
        return true;
    }

    if (!hasOtherHumanListeners(member)) {
        return true;
    }

    if (await hasElevatedMusicPermission({ client, guild, member })) {
        return true;
    }

    return songs.length > 0 && songs.every((song) => song.requester.id === member.id);
}
