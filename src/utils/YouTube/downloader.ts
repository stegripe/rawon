import { createReadStream, createWriteStream, existsSync, appendFileSync, unlinkSync } from "fs";
import { videoInfo, downloadOptions, videoFormat, getInfo, downloadFromInfo } from "ytdl-core";
import { resolve as resolvePath } from "path";
import { Readable } from "stream";

// 1048576 * 1 = 1MB
const defaultOptions: IdownloadOptions = { quality: "highestaudio", highWaterMark: 1048576 * 32 };

export function getMusicInfo(link: string, options = defaultOptions): Promise<IMusicInfo> {
    options = Object.assign(options, defaultOptions);
    return new Promise((resolve, reject) => {
        getInfo(link).then(info => {
            const canSkipFFmpeg: boolean = info.formats.find(filter) !== undefined && options.skipFFmpeg === true;
            return resolve({ ...info, canSkipFFmpeg });
        }).catch(reject);
    });
}

export function downloadMusic(info: IMusicInfo, options = defaultOptions): IMusicStream {
    options = Object.assign(options, defaultOptions);
    options = info.canSkipFFmpeg ? { ...options, filter } : { ...options };
    return Object.assign(downloadFromInfo(info, options), { info });
}

export function playMusic(link: string, options = defaultOptions): Promise<IMusicData> {
    options = Object.assign(options, defaultOptions);
    return new Promise((resolve, reject) => {
        getMusicInfo(link, options).then(info => {
            const stream = downloadMusic(info, options)
                .on("error", reject);
            if (options.cache && !info.videoDetails.isLiveContent && !(Number(info.videoDetails.lengthSeconds) >= options.cacheMaxLength!)) {
                const cachePath = resolvePath(process.cwd(), "cache");
                const filePath = resolvePath(cachePath, `${info.videoDetails.videoId}.webm`);
                const finishMarkerPath = resolvePath(cachePath, `${filePath}.jukeboxCacheFinish.marker`);
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

function cache(stream: IMusicStream, filePath: string, finishMarkerPath: string): Promise<IMusicStream> {
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

export interface IMusicInfo extends videoInfo {
    canSkipFFmpeg: boolean;
}

interface IMusicStream extends Readable {
    info: IMusicInfo;
}
export interface IMusicData extends IMusicStream {
    cache: boolean;
}

export interface IdownloadOptions extends downloadOptions { cache?: boolean; cacheMaxLength?: number; skipFFmpeg?: boolean }
