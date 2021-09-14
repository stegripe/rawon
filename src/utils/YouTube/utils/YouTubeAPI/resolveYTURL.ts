import { URL } from "url";

export const youtubeHostnames = ["youtu.be", "youtube.com", "www.youtube.com", "music.youtube.com"];

export function resolveYTVideoID(url: string): string | null {
    const videoURL = new URL(url);

    if (youtubeHostnames.includes(videoURL.hostname)) {
        if (videoURL.hostname === "youtu.be" && videoURL.pathname !== "/") return videoURL.pathname.replace("/", "");
        if (videoURL.pathname === "/watch") return videoURL.searchParams.get("v");
    }

    return null;
}

export function resolveYTPlaylistID(url: string): string | null {
    const videoURL = new URL(url);

    if (youtubeHostnames.includes(videoURL.hostname) &&
        videoURL.hostname !== "youtu.be" &&
        videoURL.pathname === "/playlist") return videoURL.searchParams.get("list");

    return null;
}
