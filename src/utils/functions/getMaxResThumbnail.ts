/**
 * Upgrades YouTube thumbnail URLs to maximum resolution using img.youtube.com.
 * Extracts the video ID and constructs a maxresdefault thumbnail URL.
 *
 * @param url - The thumbnail URL to upgrade
 * @returns The upgraded URL with maxresdefault quality from img.youtube.com, or original URL if not a YouTube thumbnail
 */
export function getMaxResThumbnail(url: string | undefined | null): string {
    if (!url || url.length === 0) {
        return "";
    }

    // Parse URL to properly validate the hostname
    let parsedUrl: URL;
    try {
        parsedUrl = new URL(url);
    } catch {
        // Invalid URL, return as-is
        return url;
    }

    const validHosts = "img.youtube.com";
    if (!validHosts.includes(parsedUrl.hostname)) {
        return url;
    }

    // Extract video ID from the URL path (e.g., /vi/VIDEO_ID/...)
    const videoIdMatch = parsedUrl.pathname.match(/\/vi\/([^/]+)/u);
    if (!videoIdMatch?.[1]) {
        return url;
    }

    // Return maxresdefault thumbnail URL from img.youtube.com
    return `https://img.youtube.com/vi/${videoIdMatch[1]}/maxresdefault.jpg`;
}
