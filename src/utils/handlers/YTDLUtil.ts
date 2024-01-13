/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/naming-convention */
import { BasicYoutubeVideoInfo } from "../../typings/index.js";
import ytdl, { exec } from "../../../yt-dlp-utils/index.js";
import { streamStrategy } from "../../config/index.js";
import { Rawon } from "../../structures/Rawon.js";
import { checkQuery } from "./GeneralUtil.js";
import { Readable } from "node:stream";

// @ts-expect-error play-dl is optional
const { stream: pldlStream, video_basic_info } = await import("play-dl").catch(() => ({ stream: null, video_basic_info: null }));

export async function getStream(client: Rawon, url: string): Promise<Readable> {
    if (streamStrategy === "play-dl") {
        const isSoundcloudUrl = checkQuery(url);
        if (isSoundcloudUrl.sourceType === "soundcloud") {
            return client.soundcloud.util.streamTrack(url) as unknown as Readable;
        }
        const rawPlayDlStream = await pldlStream(url, { discordPlayerCompatibility: true });
        return rawPlayDlStream.stream;
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
            reject(Error("Unable to retrieve audio data from the URL."));
        }

        void stream.on("spawn", () => {
            resolve(stream.stdout!);
        });
    });
}

export async function getInfo(url: string): Promise<BasicYoutubeVideoInfo> {
    if (streamStrategy === "play-dl") {
        const rawPlayDlVideoInfo = await video_basic_info(url);
        return {
            duration: rawPlayDlVideoInfo.video_details.durationInSec * 1000,
            id: rawPlayDlVideoInfo.video_details.id!,
            thumbnails: rawPlayDlVideoInfo.video_details.thumbnails,
            title: rawPlayDlVideoInfo.video_details.title!,
            url: rawPlayDlVideoInfo.video_details.url
        };
    }
    return ytdl(url, {
        dumpJson: true
    });
}
