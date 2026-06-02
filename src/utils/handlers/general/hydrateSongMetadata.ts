import { URL } from "node:url";
import { type Rawon } from "../../../structures/Rawon.js";
import { type Song } from "../../../typings/index.js";
import { getYouTubeThumbnail } from "../../functions/getMaxResThumbnail.js";
import { youtube } from "../YouTubeUtil.js";
import { getInfo } from "../YTDLUtil.js";
import { checkQuery } from "./checkQuery.js";

function extractYouTubeVideoId(url: string): string | null {
    try {
        const parsedUrl = new URL(url);
        if (/youtu\.be/gu.test(parsedUrl.hostname)) {
            return parsedUrl.pathname.replace("/", "");
        }
        if (parsedUrl.pathname.startsWith("/shorts/")) {
            return parsedUrl.pathname.replace("/shorts/", "").split("/")[0];
        }
        if (parsedUrl.pathname.startsWith("/live/")) {
            return parsedUrl.pathname.replace("/live/", "").split("/")[0];
        }
        return parsedUrl.searchParams.get("v");
    } catch {
        return null;
    }
}

function positiveDuration(duration: unknown): number | null {
    return typeof duration === "number" && Number.isFinite(duration) && duration > 0
        ? duration
        : null;
}

export async function hydrateYouTubeSongMetadata(client: Rawon, song: Song): Promise<Song> {
    if (song.isLive === true || positiveDuration(song.duration) !== null) {
        return song;
    }

    const queryData = checkQuery(song.url);
    if (queryData.sourceType !== "youtube") {
        return song;
    }

    const videoId = extractYouTubeVideoId(song.url) ?? (song.id.length > 0 ? song.id : null);
    if (videoId === null || videoId.length === 0) {
        return song;
    }

    const videoUrl = `https://youtube.com/watch?v=${videoId}`;

    try {
        const video = await youtube.getVideo(videoId);
        const duration = video && "duration" in video ? positiveDuration(video.duration) : null;
        if (video && (video.isLiveContent === true || duration !== null)) {
            return {
                ...song,
                duration: video.isLiveContent ? 0 : (duration ?? song.duration),
                id: video.id || song.id,
                thumbnail: song.thumbnail || getYouTubeThumbnail(video.id || videoId),
                title: song.title || video.title,
                url: song.url || videoUrl,
                isLive: video.isLiveContent || song.isLive,
            };
        }
    } catch (error) {
        client.logger.debug("[hydrateSongMetadata] youtubei metadata lookup failed", {
            id: videoId,
            title: song.title,
            error: error instanceof Error ? error.message : String(error),
        });
    }

    try {
        const info = await getInfo(videoUrl, client);
        const duration = positiveDuration(info.duration);
        if (info.is_live === true || duration !== null) {
            return {
                ...song,
                duration: info.is_live ? 0 : (duration ?? song.duration),
                id: info.id || song.id,
                thumbnail: song.thumbnail || getYouTubeThumbnail(info.id || videoId),
                title: song.title || info.title,
                url: song.url || info.url || videoUrl,
                isLive: info.is_live || song.isLive,
            };
        }
    } catch (error) {
        client.logger.debug("[hydrateSongMetadata] yt-dlp metadata lookup failed", {
            id: videoId,
            title: song.title,
            error: error instanceof Error ? error.message : String(error),
        });
    }

    return song;
}
