import { type Readable } from "node:stream";
import { type Rawon } from "../../structures/Rawon.js";
import { type BasicYoutubeVideoInfo } from "../../typings/index.js";
import ytdl, { exec } from "../yt-dlp/index.js";
import { checkQuery } from "./GeneralUtil.js";

export async function getStream(client: Rawon, url: string, isLive = false): Promise<Readable> {
    const isSoundcloudUrl = checkQuery(url);
    if (isSoundcloudUrl.sourceType === "soundcloud") {
        return client.soundcloud.util.streamTrack(url) as unknown as Readable;
    }

    // Skip caching for live streams - they can't be cached and need real-time streaming
    if (!isLive && client.audioCache.isCached(url)) {
        const cachedStream = client.audioCache.getFromCache(url);
        if (cachedStream !== null) {
            return cachedStream;
        }
    }

    return new Promise<Readable>((resolve, reject) => {
        const proc = exec(
            url,
            {
                output: "-",
                quiet: true,
                format: "bestaudio",
                // Don't limit rate for live streams to avoid buffering issues
                ...(isLive ? {} : { limitRate: "300K" }),
            },
            { stdio: ["ignore", "pipe", "ignore"] },
        );

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

        proc.stdout.once("end", () => {
            proc.kill("SIGKILL");
        });

        void proc.once("spawn", () => {
            // Don't cache live streams - they're endless and can't be cached properly
            if (isLive) {
                resolve(proc.stdout as unknown as Readable);
                return;
            }

            // Cache the stream while returning it for playback
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
