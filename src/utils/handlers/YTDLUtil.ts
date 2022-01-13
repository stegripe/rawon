import ytdl, { exec } from "youtube-dl-exec";
import { Readable } from "stream";
import { streamStrategy } from "../../config";
import { stream, video_basic_info } from "play-dl";
import { basicYoutubeVideoInfo } from "../../typings";
import { checkQuery } from "./GeneralUtil";
import { soundcloud } from "./SoundCloudUtil";

export async function getStream(url: string): Promise<Readable> {
    if (streamStrategy === "play-dl") {
        const isSoundcloudUrl = checkQuery(url);
        if (isSoundcloudUrl.sourceType === "soundcloud") {
            return soundcloud.util.streamTrack(url) as unknown as Readable;
        }
        const rawPlayDlStream = await stream(url);
        return rawPlayDlStream.stream;
    } else return new Promise((resolve, reject) => {
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

export async function getInfo(url: string): Promise<basicYoutubeVideoInfo> {
    if (streamStrategy === "play-dl") {
        const rawPlayDlVideoInfo = await video_basic_info(url);
        return {
            thumbnails: rawPlayDlVideoInfo.video_details.thumbnails,
            id: rawPlayDlVideoInfo.video_details.id!,
            title: rawPlayDlVideoInfo.video_details.title!,
            url: rawPlayDlVideoInfo.video_details.url,
            duration: rawPlayDlVideoInfo.video_details.durationInSec * 1000,
        };
    } else return ytdl(url, {
        dumpJson: true
    });
}
