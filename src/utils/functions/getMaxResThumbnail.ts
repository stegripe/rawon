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

    const validHosts = "img.youtube.com";
    if (!validHosts.includes(parsedUrl.hostname)) {
        return url;
    }

    const videoIdMatch = parsedUrl.pathname.match(/\/vi\/([^/]+)/u);
    if (!videoIdMatch?.[1]) {
        return url;
    }

    return `https://img.youtube.com/vi/${videoIdMatch[1]}/maxresdefault.jpg`;
}
