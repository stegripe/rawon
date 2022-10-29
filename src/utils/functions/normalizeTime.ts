function tS(num: number): string {
    const s = num.toString();
    return s.length > 1 ? s : `0${s}`;
}

export function normalizeTime(second: number): string {
    const h = Math.floor(second / 3600);
    const m = Math.floor((second % 3600) / 60);
    const s = Math.floor(second % 60);

    return `${h > 0 ? `${tS(h)}:` : ""}${tS(m)}:${tS(s)}`;
}
