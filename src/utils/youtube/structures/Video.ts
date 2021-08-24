import { Item, itemType } from "./Item";
import ytdl, { chooseFormatOptions, videoInfo } from "ytdl-core";
import { Video as IVideo } from "ytsr";
import { Readable } from "stream";

type downloadType = "both" | "video" | "audio";

// TODO: Duration for Videos
export class Video extends Item {
    public constructor(public raw: IVideo | videoInfo, protected readonly _type: itemType) {
        super(raw, _type);
    }

    public download(type: downloadType = "both"): Readable {
        const qualities: Record<downloadType, chooseFormatOptions["quality"]> = {
            both: "highest",
            audio: "highestaudio",
            video: "highestvideo"
        };
        return ytdl(this.url, { quality: qualities[type] });
    }
}
