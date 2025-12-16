/* eslint-disable unicorn/filename-case */
import type { Readable } from "node:stream";
import type { Rawon } from "../../structures/Rawon.js";
import type { BasicYoutubeVideoInfo } from "../../typings/index.js";
import ytdl, { exec } from "../yt-dlp/index.js";
import { checkQuery } from "./GeneralUtil.js";

export async function getStream(client: Rawon, url: string): Promise<Readable> {
    const isSoundcloudUrl = checkQuery(url);
    if (isSoundcloudUrl.sourceType === "soundcloud") {
        return client.soundcloud.util.streamTrack(url) as unknown as Readable;
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
    return ytdl(url, {
        dumpJson: true
    });
}
