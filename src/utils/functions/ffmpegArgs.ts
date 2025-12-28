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
    reverb: "aecho=0.8:0.88:60:0.4",
};

export function ffmpegArgs(
    filters: Partial<Record<keyof typeof filterArgs, boolean>>,
    seekSeconds = 0,
    inputPath?: string,
): string[] {
    const keys = Object.keys(filters) as (keyof typeof filterArgs)[];
    const hasFilters = keys.some((x) => filters[x] === true);

    // Build audio filter chain
    const audioFilters: string[] = [];

    // Add user-selected filters
    if (hasFilters) {
        for (const key of keys) {
            if (filters[key] === true) {
                audioFilters.push(filterArgs[key]);
            }
        }
    }

    // Build input args - if we have a file path, use -ss for seeking
    // For pipe inputs, seeking is not supported (atrim doesn't work well with opus)
    const inputArgs: string[] = [];
    if (inputPath) {
        // File input - can use -ss for fast seeking
        if (seekSeconds > 0) {
            inputArgs.push("-ss", seekSeconds.toString());
        }
        inputArgs.push("-i", inputPath);
    } else {
        // Pipe input - no seeking support
        inputArgs.push("-i", "-");
    }

    return [
        "-loglevel",
        "0",
        ...inputArgs,
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
