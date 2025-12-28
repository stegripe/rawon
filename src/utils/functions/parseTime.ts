export function parseTime(time: string): number | null {
    const trimmed = time.trim();

    if (/^\d+$/u.test(trimmed)) {
        return Number.parseInt(trimmed, 10);
    }

    const parts = trimmed.split(":").map((p) => Number.parseInt(p, 10));

    if (parts.some((p) => Number.isNaN(p) || p < 0)) {
        return null;
    }

    if (parts.length === 2) {
        const [min, sec] = parts;
        if (sec >= 60) {
            return null;
        }
        return min * 60 + sec;
    }

    if (parts.length === 3) {
        const [hour, min, sec] = parts;
        if (min >= 60 || sec >= 60) {
            return null;
        }
        return hour * 3_600 + min * 60 + sec;
    }

    return null;
}
