export function getYouTubeThumbnail(videoId: string): string {
    return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
}

export function getMaxResThumbnail(url: string | undefined | null): string {
    if (!url || url.length === 0) {
        return "";
    }

    let parsedUrl: URL;
    try {
        parsedUrl = new URL(url);
    } catch {
        return url;
    }

    const validHosts = ["img.youtube.com", "i.ytimg.com"];
    if (!validHosts.includes(parsedUrl.hostname)) {
        return url;
    }

    const videoIdMatch = parsedUrl.pathname.match(/\/vi(?:_webp)?\/([^/]+)/u);
    if (!videoIdMatch?.[1]) {
        return url;
    }

    return getYouTubeThumbnail(videoIdMatch[1]);
}
