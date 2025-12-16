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

    // Check if it's a YouTube thumbnail URL (i.ytimg.com or img.youtube.com)
    if (!url.includes("i.ytimg.com") && !url.includes("img.youtube.com")) {
        return url;
    }

    // Replace quality variants with maxresdefault
    // Common patterns: default.jpg, mqdefault.jpg, hqdefault.jpg, sddefault.jpg
    const upgraded = url.replace(
        /\/(default|mqdefault|hqdefault|sddefault|hq720)(\.(jpg|webp))/gu,
        "/maxresdefault$2",
    );

    // Also handle URLs with query parameters (like the example in the issue)
    // https://i.ytimg.com/vi/{videoId}/hqdefault.jpg?sqp=...
    return upgraded.replace(
        /\/(default|mqdefault|hqdefault|sddefault|hq720)\.jpg\?/gu,
        "/maxresdefault.jpg?",
    );
}
