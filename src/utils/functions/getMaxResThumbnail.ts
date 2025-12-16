/**
 * Upgrades YouTube thumbnail URLs to maximum resolution.
 * YouTube thumbnails have quality variants: default, mqdefault, hqdefault, sddefault, maxresdefault
 * This function replaces lower quality variants with maxresdefault for better image quality.
 *
 * @param url - The thumbnail URL to upgrade
 * @returns The upgraded URL with maxresdefault quality, or original URL if not a YouTube thumbnail
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

    // Check if it's a YouTube thumbnail URL by validating the hostname
    const validHosts = ["i.ytimg.com", "img.youtube.com"];
    if (!validHosts.includes(parsedUrl.hostname)) {
        return url;
    }

    // Replace quality variants with maxresdefault
    // Handles: default, mqdefault, hqdefault, sddefault, hq720
    // Handles extensions: jpg, jpeg, webp, png
    // Handles URLs with or without query parameters
    return url.replace(
        /\/(default|mqdefault|hqdefault|sddefault|hq720)\.(jpg|jpeg|webp|png)/gu,
        "/maxresdefault.$2",
    );
}
