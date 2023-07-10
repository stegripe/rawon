export const filterArgs = {
    bassboost: "bass=g=7.5",
    nightcore: "aresample=48000,asetrate=48000*1.25",
    vaporwave: "aresample=48000,asetrate=48000*0.8",
    treble: "treble=g=5",
    "8d": "apulsator=hz=0.08",
    reverse: "areverse",
    surround: "surround",
    haas: "haas",
    phaser: "aphaser=in_gain=0.4",
    gate: "agate",
    mcompand: "mcompand",
    flanger: "flanger",
    tremolo: "tremolo",
    karaoke: "stereotools=mlev=0.1",
    vibrato: "vibrato=f=6.5",
    echo: "aecho=0.8:0.9:1000:0.3"
}

export function ffmpegArgs(filters: Partial<Record<keyof typeof filterArgs, boolean>>): string[] {
    const keys = Object.keys(filters) as (keyof typeof filterArgs)[];
    return [
        "-loglevel", "0",
        "-ar", "48000",
        "-ac", "2",
        "-f", "opus",
        "-acodec", "libopus",
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
