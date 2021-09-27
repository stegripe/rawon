import ytdl, { raw, YtResponse } from "youtube-dl-exec";
import { Readable } from "stream";

export function getStream(url: string): Promise<Readable> {
    return new Promise((resolve, reject) => {
        const stream = raw(
            url,
            {
                o: "-",
                q: "",
                f: "bestaudio[ext=webm+acodec=opus+asr=48000]/bestaudio"
            },
            {
                stdio: ["ignore", "pipe", "ignore"]
            }
        );

        if (!stream.stdout) {
            reject(Error("Unable to retrieve audio data from the URL"));
        }

        void stream.on("spawn", () => {
            resolve(stream.stdout!);
        });
    });
}

export async function getInfo(url: string): Promise<YtResponse> {
    return ytdl(url, {
        j: true
    });
}
