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

    const validHosts = ["i.ytimg.com", "img.youtube.com"];
    if (!validHosts.includes(parsedUrl.hostname)) {
        return url;
    }

    return url.replace(
        /\/(default|mqdefault|hqdefault|sddefault|hq720)\.(jpg|jpeg|webp|png)/gu,
        "/maxresdefault.$2",
    );
}
