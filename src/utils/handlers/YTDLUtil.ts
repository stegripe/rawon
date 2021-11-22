import ytdl, { exec, YtResponse } from "youtube-dl-exec";
import { Readable } from "stream";

export function getStream(url: string): Promise<Readable> {
    return new Promise((resolve, reject) => {
        const stream = exec(
            url,
            {
                output: "-",
                quiet: true,
                format: "bestaudio[acodec=opus]/bestaudio",
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
            resolve(stream.stdout as Readable);
        });
    });
}

export async function getInfo(url: string): Promise<YtResponse> {
    return ytdl(url, {
        dumpJson: true
    });
}
