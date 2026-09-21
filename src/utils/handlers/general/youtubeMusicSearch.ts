import got from "got";
import { type Song } from "../../../typings/index.js";
import { getMediumResThumbnail, isGoogleImageHost } from "../../functions/getMaxResThumbnail.js";

const SEARCH_ENDPOINT = "https://music.youtube.com/youtubei/v1/search?prettyPrint=false";
const CLIENT_VERSION = "1.20260609.01.00";
const USER_AGENT =
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36";
const SONGS_FILTER = "EgWKAQIIAWoKEAMQBBAJEAoQBQ%3D%3D";
const VIDEO_ID_PATTERN = /^[\w-]{11}$/u;
const DURATION_PATTERN = /^\d{1,2}(:\d{2}){1,2}$/u;

type JsonObject = Record<string, unknown>;

function isObject(value: unknown): value is JsonObject {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function walkJson(value: unknown, visit: (node: JsonObject) => void): void {
    if (Array.isArray(value)) {
        for (const item of value) {
            walkJson(item, visit);
        }
        return;
    }
    if (!isObject(value)) {
        return;
    }
    visit(value);
    for (const child of Object.values(value)) {
        walkJson(child, visit);
    }
}

function youtubeMusicContext(): JsonObject {
    return {
        client: {
            hl: "en",
            gl: "ID",
            clientName: "WEB_REMIX",
            clientVersion: CLIENT_VERSION,
            osName: "Windows",
            osVersion: "10.0",
            platform: "DESKTOP",
            browserName: "Chrome",
            browserVersion: "149.0.0.0",
            userAgent: `${USER_AGENT},gzip(gfe)`,
        },
        user: { lockedSafetyMode: false },
        request: { useSsl: true },
    };
}

function textFromPayload(payload: unknown): string {
    if (!isObject(payload)) {
        return "";
    }
    if (typeof payload.simpleText === "string" && payload.simpleText.trim().length > 0) {
        return payload.simpleText.trim();
    }
    if (typeof payload.content === "string" && payload.content.trim().length > 0) {
        return payload.content.trim();
    }
    if (!Array.isArray(payload.runs)) {
        return "";
    }
    for (const run of payload.runs) {
        if (isObject(run) && typeof run.text === "string" && run.text.trim().length > 0) {
            return run.text.trim();
        }
    }
    return "";
}

function isAvatarThumbnail(url: string): boolean {
    const lower = url.toLowerCase();
    return lower.includes("/ytc/") || lower.includes("/a/") || lower.includes("-c-k-c0");
}

function durationFromPayload(payload: unknown): number {
    let duration = "";
    walkJson(payload, (node) => {
        if (duration.length > 0) {
            return;
        }
        for (const value of Object.values(node)) {
            if (typeof value === "string" && DURATION_PATTERN.test(value)) {
                duration = value;
                return;
            }
        }
    });
    if (duration.length === 0) {
        return 0;
    }

    return duration.split(":").reduce((total, part) => total * 60 + Number(part), 0);
}

function thumbnailFromRenderer(renderer: JsonObject): string {
    let bestUrl = "";
    let bestScore = -1;
    walkJson(renderer, (node) => {
        if (typeof node.url !== "string" || node.url.length === 0) {
            return;
        }
        try {
            const hostname = new URL(node.url).hostname;
            if (!isGoogleImageHost(hostname) || isAvatarThumbnail(node.url)) {
                return;
            }
        } catch {
            return;
        }
        const width = typeof node.width === "number" ? node.width : 0;
        const height = typeof node.height === "number" ? node.height : 0;
        const score =
            width > 0 && height > 0
                ? width * height - Math.abs(width - height) * 1_000
                : node.url.length;
        if (score <= bestScore) {
            return;
        }
        bestScore = score;
        bestUrl = node.url;
    });
    return bestUrl.length > 0 ? getMediumResThumbnail(bestUrl) : "";
}

function videoIdFromRenderer(renderer: JsonObject): string {
    if (
        isObject(renderer.playlistItemData) &&
        typeof renderer.playlistItemData.videoId === "string"
    ) {
        const id = renderer.playlistItemData.videoId.trim();
        if (VIDEO_ID_PATTERN.test(id)) {
            return id;
        }
    }

    let found = "";
    walkJson(renderer, (node) => {
        if (found.length > 0 || typeof node.videoId !== "string") {
            return;
        }
        const id = node.videoId.trim();
        if (VIDEO_ID_PATTERN.test(id)) {
            found = id;
        }
    });
    return found;
}

function textColumns(renderer: JsonObject): { title: string; author: string } {
    const values: string[] = [];
    if (!Array.isArray(renderer.flexColumns)) {
        return { title: "", author: "" };
    }

    for (const column of renderer.flexColumns) {
        if (!isObject(column)) {
            continue;
        }
        const flexColumn = column.musicResponsiveListItemFlexColumnRenderer;
        if (!isObject(flexColumn)) {
            continue;
        }
        const text = textFromPayload(flexColumn.text);
        if (text.length > 0) {
            values.push(text);
        }
    }

    return {
        title: values[0] ?? "",
        author: values[1] ?? "",
    };
}

function songFromRenderer(renderer: JsonObject): Song | null {
    const id = videoIdFromRenderer(renderer);
    const { title, author } = textColumns(renderer);
    if (id.length === 0 || title.length === 0) {
        return null;
    }

    const url = `https://music.youtube.com/watch?v=${id}`;
    return {
        id,
        title,
        url,
        duration: durationFromPayload(renderer),
        thumbnail: thumbnailFromRenderer(renderer),
        author: author.length > 0 ? author : undefined,
    };
}

export async function searchYouTubeMusic(query: string, limit = 10): Promise<Song[]> {
    const payload = await got
        .post(SEARCH_ENDPOINT, {
            json: {
                context: youtubeMusicContext(),
                query,
                params: SONGS_FILTER,
            },
            headers: {
                "Content-Type": "application/json",
                Origin: "https://music.youtube.com",
                Referer: "https://music.youtube.com/",
                "User-Agent": USER_AGENT,
                "X-Youtube-Client-Name": "67",
                "X-Youtube-Client-Version": CLIENT_VERSION,
            },
            timeout: { request: 12_000 },
        })
        .json();

    const items: Song[] = [];
    const seen = new Set<string>();
    walkJson(payload, (node) => {
        if (items.length >= limit) {
            return;
        }
        const renderer = node.musicResponsiveListItemRenderer;
        if (!isObject(renderer)) {
            return;
        }
        const song = songFromRenderer(renderer);
        if (song === null || seen.has(song.id)) {
            return;
        }
        seen.add(song.id);
        items.push(song);
    });
    return items;
}
