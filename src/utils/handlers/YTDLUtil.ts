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

export async function getStream(client: Rawon, url: string): Promise<Readable> {
    if (streamStrategy === "play-dl") {
        const isSoundcloudUrl = checkQuery(url);
        if (isSoundcloudUrl.sourceType === "soundcloud") {
            return client.soundcloud.util.streamTrack(url) as unknown as Readable;
        }
        const rawPlayDlStream = await pldlStream?.(url, { discordPlayerCompatibility: true });
        return rawPlayDlStream?.stream as unknown as Readable;
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
    
        // Validate if stdout exists
        if (!stream.stdout) {
            reject(new Error("Unable to retrieve audio data from the URL."));
            return; // Explicitly exit to avoid continuing the flow
        }
    
        const output = stream.stdout;
    
        // Configure events for the stream
        stream.on("spawn", () => {
            output.on("end", () => {
                stream.kill("SIGTERM"); // Terminate the yt-dlp process
            });
    
            output.on("error", (error) => {
                stream.kill("SIGTERM"); // Terminate the process in case of an error
                reject(error); // Reject the promise if an error occurs
            });
    
            resolve(output); // Resolve the promise with the stream
        });
    
        // Handle errors in the main process
        stream.on("error", (error) => {
            stream.kill("SIGTERM"); // Release resources if an error occurs in the process
            reject(error); // Reject the promise
        });
    });
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
