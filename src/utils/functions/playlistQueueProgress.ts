import { type Guild, type GuildMember } from "discord.js";
import { type Rawon } from "../../structures/Rawon.js";
import { type Song } from "../../typings/index.js";
import { type SongManager } from "../structures/SongManager.js";
import { formatBoldCodeSpan } from "./formatCodeSpan.js";
import { i18n__mf } from "./i18n.js";

const PLAYLIST_PROGRESS_CHUNK = 10;
const PLAYLIST_PROGRESS_MIN_EDIT_MS = 2_000;

export function shouldShowPlaylistProgress(songCount: number, hasPlaylistMeta: boolean): boolean {
    return hasPlaylistMeta && songCount > 1;
}

export function formatResolvingPlaylistNotice(
    client: Rawon,
    guild: Guild | string | null | undefined,
): string {
    return i18n__mf(client, guild)("requestChannel.resolvingPlaylist");
}

export function formatAddingPlaylistProgress(
    client: Rawon,
    guild: Guild | string | null | undefined,
    current: number,
    total: number,
): string {
    const __mf = i18n__mf(client, guild);
    return __mf("requestChannel.addingPlaylistToQueue", {
        current: formatBoldCodeSpan(current.toString()),
        total: formatBoldCodeSpan(total.toString()),
    });
}

export async function addSongsWithProgress(
    songManager: SongManager,
    songs: Song[],
    requester: GuildMember,
    onProgress: (current: number, total: number) => Promise<void>,
): Promise<void> {
    const total = songs.length;
    if (total === 0) {
        return;
    }

    if (total === 1) {
        songManager.addSong(songs[0], requester);
        return;
    }

    let lastEditAt = 0;

    for (let start = 0; start < total; start += PLAYLIST_PROGRESS_CHUNK) {
        const chunk = songs.slice(start, Math.min(start + PLAYLIST_PROGRESS_CHUNK, total));
        songManager.addSongs(chunk, requester);

        const current = Math.min(start + chunk.length, total);
        const isLast = current === total;
        const now = Date.now();
        if (isLast || now - lastEditAt >= PLAYLIST_PROGRESS_MIN_EDIT_MS) {
            await onProgress(current, total);
            lastEditAt = now;
        }
    }
}
