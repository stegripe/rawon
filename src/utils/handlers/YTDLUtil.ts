/* eslint-disable unicorn/filename-case, typescript/naming-convention */
import type { Readable } from "node:stream";
import ytdl, { exec } from "../../../yt-dlp-utils/index.js";
import { streamStrategy } from "../../config/index.js";
import type { Rawon } from "../../structures/Rawon.js";
import type { BasicYoutubeVideoInfo } from "../../typings/index.js";
import { checkQuery } from "./GeneralUtil.js";

type PldlStreamFn = (url: string, options: { discordPlayerCompatibility: boolean }) => Promise<{ stream: Readable }>;
type VideoBasicInfoFn = (url: string) => Promise<{ video_details: { durationInSec: number; id: string | null; thumbnails: unknown[]; title: string | null; url: string } }>;

let playDlModule: { stream: PldlStreamFn; video_basic_info: VideoBasicInfoFn } | null = null;
let playDlImportError: Error | null = null;

try {
    playDlModule = await import("../../../play-dl-importer/index.js").then(x => x.default);
} catch (error) {
    playDlImportError = error as Error;
}

export async function getStream(client: Rawon, url: string): Promise<Readable> {
    if (streamStrategy === "play-dl") {
        const isSoundcloudUrl = checkQuery(url);
        if (isSoundcloudUrl.sourceType === "soundcloud") {
            return client.soundcloud.util.streamTrack(url) as unknown as Readable;
        }
        if (!playDlModule) {
            const errorMessage = playDlImportError 
                ? `play-dl failed to load: ${playDlImportError.message}` 
                : "play-dl is not available. Please install play-dl or use yt-dlp as the stream strategy.";
            throw new Error(errorMessage);
        }
        const rawPlayDlStream = await playDlModule.stream(url, { discordPlayerCompatibility: true });
        if (rawPlayDlStream.stream === undefined || rawPlayDlStream.stream === null) {
            throw new Error("Failed to get stream from play-dl. The stream returned was undefined.");
        }
        return rawPlayDlStream.stream as unknown as Readable;
    }

  return new Promise<Readable>((resolve, reject) => {
    const proc = exec(
      url,
      {
        output: "-",
        quiet: true,
        format: "bestaudio",
        limitRate: "300K"
      },
      { stdio: ["ignore", "pipe", "ignore"] }
    );

    if (!proc.stdout) {
      reject(new Error("Error obtaining stdout from process."));
      return;
    }

    proc.once("error", err => {
      proc.kill("SIGKILL");
      reject(err);
    });

    proc.stdout.once("error", err => {
      proc.kill("SIGKILL");
      reject(err);
    });

    proc.stdout.once("end", () => {
      proc.kill("SIGKILL");
    });

    void proc.once("spawn", () => {
      resolve(proc.stdout as unknown as Readable);
    });
  });
}

export async function getInfo(url: string): Promise<BasicYoutubeVideoInfo> {
    if (streamStrategy === "play-dl") {
        if (!playDlModule) {
            const errorMessage = playDlImportError 
                ? `play-dl failed to load: ${playDlImportError.message}` 
                : "play-dl is not available. Please install play-dl or use yt-dlp as the stream strategy.";
            throw new Error(errorMessage);
        }
        const rawPlayDlVideoInfo = await playDlModule.video_basic_info(url);
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
