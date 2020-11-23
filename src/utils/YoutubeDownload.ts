import { videoInfo, downloadOptions, videoFormat, getInfo, downloadFromInfo } from "ytdl-core";
import { Readable } from "stream";
import { resolve as resolvePath } from "path";
import { createReadStream, createWriteStream, existsSync, appendFileSync, unlinkSync } from "fs";

// 1048576 * 1 = 1MB
const defaultOptions: IdownloadOptions = { quality: "highestaudio", highWaterMark: 1048576 * 32 };

export function getSongInfo(link: string, options = defaultOptions): Promise<ISongInfo> {
    return new Promise((resolve, reject) => {
        getInfo(link).then(info => {
            const canSkipFFmpeg: boolean = info.formats.find(filter) !== undefined && options.skipFFmpeg === true;
            return resolve({ ...info, canSkipFFmpeg });
        }).catch(reject);
    });
}

export function downloadSong(info: ISongInfo, options = defaultOptions): ISongStream {
    options = info.canSkipFFmpeg ? { ...options, filter } : { ...options };
    return Object.assign(downloadFromInfo(info, options), { info });
}

export function playSong(link: string, options = defaultOptions): Promise<ISongData> {
    return new Promise((resolve, reject) => {
        getSongInfo(link, options).then(info => {
            const stream = downloadSong(info, options)
                .on("error", reject);
            if (options.cache && !info.videoDetails.isLiveContent && !(Number(info.videoDetails.lengthSeconds) >= options.cacheMaxLength!)) {
                const cachePath = resolvePath(process.cwd(), "cache");
                const filePath = resolvePath(cachePath, `${info.videoDetails.videoId}.webm`);
                const finishMarkerPath = resolvePath(cachePath, `${filePath}.disc11CacheFinish.marker`);
                if (existsSync(filePath) && existsSync(finishMarkerPath)) {
                    const fileStream = createReadStream(filePath)
                        .on("error", reject);
                    stream.destroy();
                    return resolve(Object.assign(fileStream, { info: stream.info, cache: true }));
                }
                cache(stream, filePath, finishMarkerPath).then(stream => resolve(Object.assign(stream, { cache: false }))).catch(reject);
            }
            return resolve(Object.assign(stream, { cache: false }));
        }).catch(reject);
    });
}

function cache(stream: ISongStream, filePath: string, finishMarkerPath: string): Promise<ISongStream> {
    return new Promise((resolve, reject) => {
        const cacheStream = createWriteStream(filePath, { flags: "w" })
            .on("pipe", () => unlinkSync(finishMarkerPath))
            .on("finish", () => appendFileSync(finishMarkerPath, ""))
            .on("error", reject);
        stream.pipe(cacheStream);
        stream.on("error", reject);
        return resolve(Object.assign(stream, { info: stream.info }));
    });
}

function filter(f: videoFormat): boolean {
    return f.hasAudio && f.codecs === "opus" && f.container === "webm" && Number(f.audioSampleRate) === 48000;
}

interface ISongInfo extends videoInfo {
    canSkipFFmpeg: boolean;
}

interface ISongStream extends Readable {
    info: ISongInfo;
}
interface ISongData extends ISongStream {
    cache: boolean;
}

interface IdownloadOptions extends downloadOptions { cache?: boolean; cacheMaxLength?: number; skipFFmpeg?: boolean }
