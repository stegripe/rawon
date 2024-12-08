/* eslint-disable unicorn/filename-case */
/* eslint-disable typescript/naming-convention */
import type { Readable } from "node:stream";
import ytdl, { exec } from "../../../yt-dlp-utils/index.js";
import { streamStrategy } from "../../config/index.js";
import type { Rawon } from "../../structures/Rawon.js";
import type { BasicYoutubeVideoInfo } from "../../typings/index.js";
import { checkQuery } from "./GeneralUtil.js";

type Unpromisify<T> = T extends Promise<infer U> ? U : T;

const { stream: pldlStream, video_basic_info } = await import("../../../play-dl-importer/index.js").then(x => x.default).catch(() => ({ stream: null, video_basic_info: null }));

let currentStream: Readable | null = null; // Store current audio stream
let currentProcess: ReturnType<typeof exec> | null = null; // Store current yt-dlp process

export async function getStream(client: Rawon, url: string): Promise<Readable> {
    if (streamStrategy === "play-dl") {
        const isSoundcloudUrl = checkQuery(url);
        if (isSoundcloudUrl.sourceType === "soundcloud") {
            return client.soundcloud.util.streamTrack(url) as unknown as Readable;
        }

        const rawPlayDlStream = await pldlStream?.(url, { discordPlayerCompatibility: true });

        // Verify that the stream exists explicitly
        if (rawPlayDlStream?.stream === undefined || rawPlayDlStream?.stream === null) {
            throw new Error("Failed to retrieve a valid stream.");
        }

        currentStream = rawPlayDlStream.stream;
        return currentStream;
    }

    return new Promise((resolve, reject) => {
        const stream = exec(
            url,
            {
                output: "-",
                quiet: true,
                format: "bestaudio",
                limitRate: "100K"
            },
            {
                stdio: ["ignore", "pipe", "ignore"]
            }
        );

        if (!stream.stdout) {
            reject(new Error("Unable to retrieve audio data from the URL."));
            return;
        }

        currentStream = stream.stdout;
        currentProcess = stream;

        stream.on("spawn", () => {
            if (currentStream === null) {
                reject(new Error("Stream is null unexpectedly."));
                return;
            }

            currentStream.on("end", () => {
                stream.kill("SIGTERM"); // Terminate the yt-dlp process
            });

            currentStream.on("error", (error) => {
                stream.kill("SIGTERM"); // Terminate the process in case of an error
                reject(error); // Reject the promise if an error occurs
            });

            resolve(currentStream);
        });

        stream.on("error", (error) => {
            stream.kill("SIGTERM"); // Terminate process if an error occurs
            reject(error);
        });
    });
}


// Stop the current stream and release resources
export function destroyStream(): void {
    if (currentStream) {
        currentStream.destroy();
        currentStream = null;
    }
}

// Kill the current yt-dlp process
export function killProcess(): void {
    if (currentProcess) {
        currentProcess.kill("SIGTERM");
        currentProcess = null;
    }
}

export async function getInfo(url: string): Promise<BasicYoutubeVideoInfo> {
    if (streamStrategy === "play-dl") {
        const rawPlayDlVideoInfo = await video_basic_info?.(url) as unknown as Unpromisify<ReturnType<NonNullable<typeof video_basic_info>>>;
        return {
            duration: rawPlayDlVideoInfo.video_details.durationInSec * 1_000,
            id: rawPlayDlVideoInfo.video_details.id ?? "",
            thumbnails: rawPlayDlVideoInfo.video_details.thumbnails,
            title: rawPlayDlVideoInfo.video_details.title ?? "",
            url: rawPlayDlVideoInfo.video_details.url
        };
    }
    return ytdl(url, {
        dumpJson: true
    });
}
