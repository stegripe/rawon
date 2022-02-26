import { BasicYoutubeVideoInfo } from "../../typings";
import { soundcloud } from "./SoundCloudUtil";
import { streamStrategy } from "../../config";
import { checkQuery } from "./GeneralUtil";
import { stream as pldlStream, video_basic_info } from "play-dl";
import ytDefault, { exec as ytExec } from "youtube-dl-exec";
import { createRequire } from "module";
import { Readable } from "stream";

const require = createRequire(import.meta.url);
const YTDLExec = require("youtube-dl-exec") as { exec: typeof ytExec; default: typeof ytDefault };
const { exec, default: ytdl } = YTDLExec;

export async function getStream(url: string): Promise<Readable> {
    if (streamStrategy === "play-dl") {
        const isSoundcloudUrl = checkQuery(url);
        if (isSoundcloudUrl.sourceType === "soundcloud") {
            return soundcloud.util.streamTrack(url) as unknown as Readable;
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
    } return ytdl(url, {
        dumpJson: true
    });
}
