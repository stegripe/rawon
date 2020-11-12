import { videoInfo, downloadOptions, videoFormat, getInfo, downloadFromInfo } from "ytdl-core";
import { Readable, PassThrough } from "stream";
import { resolve as resolvePath } from "path";
import { createReadStream, createWriteStream, existsSync, appendFileSync } from "fs";

// Inspired by ytdl-core-discord (https://github.com/amishshah/ytdl-core-discord)  // 1048576 * 1 = 1MB
export function playSong(youtubeLink: string, options: IdownloadOptions = { filter: "audio", quality: "highestaudio", highWaterMark: 1048576 * 32 }): Promise<ISongData> {
    return new Promise((resolve, reject) => {
        getInfo(youtubeLink).then(info => {
            const canDemux: boolean = info.formats.find(filter) !== undefined && Number(info.videoDetails.lengthSeconds) !== 0;
            options = canDemux ? { ...options, filter } : { ...options };
            if (options.cache! && info.formats.find(f => !f.isLive) && !(Number(info.videoDetails.lengthSeconds) >= options.cacheMaxLength!)) {
                const path = resolvePath(process.cwd(), "cache");
                const filePath = resolvePath(path, `${info.videoDetails.videoId}.webm`);
                const finishMarkerPath = `${filePath}.jukeboxCacheFinish.marker`;
                if (existsSync(resolvePath(filePath))) {
                    if (existsSync(resolvePath(finishMarkerPath))) return resolve({ canDemux, info, stream: createReadStream(filePath), cache: true });
                    return cache(info, options, canDemux, filePath, finishMarkerPath, resolve);
                }
                return cache(info, options, canDemux, filePath, finishMarkerPath, resolve);
            }
            return resolve({ canDemux, info, stream: downloadFromInfo(info, options), cache: false });
        }).catch(reject);
    });
}

function filter(f: videoFormat): boolean {
    return f.codecs === "opus" && f.container === "webm" && Number(f.audioSampleRate) === 48000;
}

function cache(info: videoInfo, options: IdownloadOptions, canDemux: boolean, path: string, finishMarkerPath: string, resolve: any): any {
    const data = downloadFromInfo(info, options);
    const stream = new PassThrough();
    const cache = createWriteStream(path)
        .on("close", () => appendFileSync(finishMarkerPath, ""));
    data.on("data", chunk => { stream.write(chunk); cache.write(chunk); });
    data.on("end", () => { stream.end(); cache.end(); });
    return resolve({ canDemux, info, stream, cache: false });
}

interface ISongData {
    canDemux: boolean;
    info: videoInfo;
    stream: Readable;
    cache: boolean;
}

interface IdownloadOptions extends downloadOptions { cache?: boolean; cacheMaxLength?: number }
