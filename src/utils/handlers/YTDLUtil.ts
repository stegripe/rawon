import { type Readable } from "node:stream";
import { enableAudioCache } from "../../config/env.js";
import { type Rawon } from "../../structures/Rawon.js";
import { type BasicYoutubeVideoInfo } from "../../typings/index.js";
import ytdl, { exec, refreshOAuthToken } from "../yt-dlp/index.js";
import { checkQuery } from "./GeneralUtil.js";

export async function getStream(client: Rawon, url: string, isLive = false): Promise<Readable> {
    const isSoundcloudUrl = checkQuery(url);
    if (isSoundcloudUrl.sourceType === "soundcloud") {
        return client.soundcloud.util.streamTrack(url) as unknown as Readable;
    }

    if (enableAudioCache && !isLive && client.audioCache.isCached(url)) {
        const cachedStream = client.audioCache.getFromCache(url);
        if (cachedStream !== null) {
            return cachedStream;
        }
    }

    // Refresh OAuth token before streaming
    await refreshOAuthToken();

    return new Promise<Readable>((resolve, reject) => {
        const options = isLive
            ? {
                  output: "-",
                  quiet: true,
                  format: "best[acodec!=none]/bestaudio/best",
                  liveFromStart: false,
              }
            : {
                  output: "-",
                  quiet: true,
                  format: "bestaudio",
                  limitRate: "300K",
              };

        const proc = exec(url, options, { stdio: ["ignore", "pipe", "ignore"] });

        if (!proc.stdout) {
            reject(new Error("Error obtaining stdout from process."));
            return;
        }

        proc.once("error", (err) => {
            proc.kill("SIGKILL");
            reject(err);
        });

        proc.stdout.once("error", (err) => {
            proc.kill("SIGKILL");
            reject(err);
        });

        if (!isLive) {
            proc.stdout.once("end", () => {
                proc.kill("SIGKILL");
            });
        }

        void proc.once("spawn", () => {
            if (isLive || !enableAudioCache) {
                resolve(proc.stdout as unknown as Readable);
                return;
            }

            const passthroughStream = client.audioCache.cacheStream(
                url,
                proc.stdout as unknown as Readable,
            );
            resolve(passthroughStream);
        });
    });
}

export async function getInfo(url: string): Promise<BasicYoutubeVideoInfo> {
    return ytdl(url, {
        dumpJson: true,
    });
}
