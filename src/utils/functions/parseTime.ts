/**
 * Parse a time string into seconds.
 * Supports formats: "1:30" (1m 30s), "1:30:00" (1h 30m), "90" (90s)
 */
export function parseTime(time: string): number | null {
    const trimmed = time.trim();

    // Check if it's just a number (seconds)
    if (/^\d+$/u.test(trimmed)) {
        return Number.parseInt(trimmed, 10);
    }

    // Check for mm:ss or hh:mm:ss format
    const parts = trimmed.split(":").map((p) => Number.parseInt(p, 10));

    if (parts.some((p) => Number.isNaN(p) || p < 0)) {
        return null;
    }

    if (parts.length === 2) {
        // mm:ss
        const [min, sec] = parts;
        if (sec >= 60) {
            return null;
        }
        return min * 60 + sec;
    }

    if (parts.length === 3) {
        // hh:mm:ss
        const [hour, min, sec] = parts;
        if (min >= 60 || sec >= 60) {
            return null;
        }
        return hour * 3_600 + min * 60 + sec;
    }

    return null;
}
