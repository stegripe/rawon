export const filterArgs = {
    bassboost: "bass=g=20,dynaudnorm=f=350",
    nightcore: "aresample=48000,asetrate=48000*1.25"
}

export function ffmpegArgs(filters: Record<keyof typeof filterArgs, boolean>): string[] {
    const keys = Object.keys(filters) as (keyof typeof filterArgs)[];
    return [
        "-loglevel", "0",
        "-f", "s16le",
        "-ar", "48000",
        "-ac", "2",
        ...(
            keys.some(x => filters[x])
                ? [
                    "-af",
                    keys.reduce<string[]>((p, c) => {
                        if (filters[c]) p.push(filterArgs[c]);
                        return p;
                    }, []).join(",")
                ] : []
        )
    ]
}
