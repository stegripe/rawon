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
    echo: "aecho=0.8:0.9:1000:0.3",
    spedup: "aresample=48000,asetrate=48000*10/9",
    slowed: "aresample=48000,asetrate=48000*0.9",
    // Room reverb with wet/dry mix - roomsize and damping tuned to reduce echo on beats
    reverb: "afreeverb=roomsize=0.6:damping=0.7:wetlevel=0.3:drylevel=0.8:width=0.8",
};

export function ffmpegArgs(
    filters: Partial<Record<keyof typeof filterArgs, boolean>>,
    seekSeconds = 0,
): string[] {
    const keys = Object.keys(filters) as (keyof typeof filterArgs)[];
    const hasFilters = keys.some((x) => filters[x] === true);

    // Build audio filter chain (only user filters, not seek)
    const audioFilters: string[] = [];

    // Add user-selected filters
    if (hasFilters) {
        for (const key of keys) {
            if (filters[key] === true) {
                audioFilters.push(filterArgs[key]);
            }
        }
    }

    // Use -ss for fast seeking (output seeking - decodes but discards until seek point)
    // This is faster than atrim because it doesn't process audio filters on skipped frames
    const seekArgs = seekSeconds > 0 ? ["-ss", String(seekSeconds)] : [];

    return [
        "-loglevel",
        "0",
        ...seekArgs,
        "-ar",
        "48000",
        "-ac",
        "2",
        "-f",
        "opus",
        "-acodec",
        "libopus",
        ...(audioFilters.length > 0 ? ["-af", audioFilters.join(",")] : []),
    ];
}
