import { type Rawon } from "../../../structures/Rawon.js";
import { type Song } from "../../../typings/index.js";
import { resolveSearchProvider } from "../../functions/searchProvider.js";
import {
    dumpYtDlpMetadata,
    extractYouTubeVideoIdFromSong,
    logYtDlpFailure,
    searchExtractorTracks,
    songsFromDump,
} from "./ytdlpMetadata.js";

function songIdentity(song: Song): string[] {
    return [song.id, song.playableUrl, song.url]
        .map((value) => value?.trim().toLowerCase() ?? "")
        .filter((value) => value.length > 0);
}

function isSameSong(first: Song, second: Song): boolean {
    const firstIds = new Set(songIdentity(first));
    if (songIdentity(second).some((value) => firstIds.has(value))) {
        return true;
    }

    const firstTitle = first.title.trim().toLowerCase();
    const secondTitle = second.title.trim().toLowerCase();
    const firstAuthor = first.author?.trim().toLowerCase() ?? "";
    const secondAuthor = second.author?.trim().toLowerCase() ?? "";
    return firstTitle.length > 0 && firstTitle === secondTitle && firstAuthor === secondAuthor;
}

function pickUnseenSong(candidates: Song[], excluded: Song[]): Song | undefined {
    return candidates.find((candidate) => !excluded.some((song) => isSameSong(song, candidate)));
}

async function resolveFromYouTubeMix(
    currentSong: Song,
    excluded: Song[],
): Promise<Song | undefined> {
    const videoId = extractYouTubeVideoIdFromSong(currentSong);
    if (videoId === null) {
        return undefined;
    }

    const mixUrl = `https://www.youtube.com/watch?v=${videoId}&list=RD${videoId}`;
    const dump = await dumpYtDlpMetadata(mixUrl, {
        flatPlaylist: true,
        yesPlaylist: true,
        playlistEnd: 20,
    });
    const { items } = songsFromDump(dump, mixUrl);
    return pickUnseenSong(items, excluded);
}

async function resolveFromSearch(
    client: Rawon,
    currentSong: Song,
    excluded: Song[],
): Promise<Song | undefined> {
    const query = [currentSong.title, currentSong.author].filter(Boolean).join(" ").trim();
    if (query.length === 0) {
        return undefined;
    }

    const result = await searchExtractorTracks(query, "youtube", 10, resolveSearchProvider(client));
    return pickUnseenSong(result.items, excluded);
}

export async function resolveAutoplayCandidate(
    client: Rawon,
    currentSong: Song,
    history: Song[],
): Promise<Song | undefined> {
    const excluded = [currentSong, ...history];

    try {
        const mixSong = await resolveFromYouTubeMix(currentSong, excluded);
        if (mixSong) {
            return mixSong;
        }
    } catch (error) {
        logYtDlpFailure(client, "autoplay-mix", error);
    }

    try {
        return await resolveFromSearch(client, currentSong, excluded);
    } catch (error) {
        logYtDlpFailure(client, "autoplay-search", error);
        return undefined;
    }
}
