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
    reverb: "[0:a]asplit=2[bass][highs];[bass]lowpass=f=300[bassclean];[highs]highpass=f=300,aecho=0.8:0.85:40:0.35[highsreverb];[bassclean][highsreverb]amix=inputs=2:duration=first",
};

export function ffmpegArgs(
    filters: Partial<Record<keyof typeof filterArgs, boolean>>,
    seekSeconds = 0,
    inputPath?: string,
): string[] {
    const keys = Object.keys(filters) as (keyof typeof filterArgs)[];
    const hasFilters = keys.some((x) => filters[x] === true);

    const audioFilters: string[] = [];

    if (hasFilters) {
        for (const key of keys) {
            if (filters[key] === true) {
                audioFilters.push(filterArgs[key]);
            }
        }
    }

    const inputArgs: string[] = [];
    if (inputPath) {
        inputArgs.push("-i", inputPath);
        if (seekSeconds > 0) {
            inputArgs.push("-ss", seekSeconds.toString());
        }
    } else {
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
