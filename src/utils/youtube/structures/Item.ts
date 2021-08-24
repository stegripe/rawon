import { Result as Playlist } from "ytpl";
import { videoInfo } from "ytdl-core";
import { Video } from "ytsr";

export type normalType = (Video | Playlist);
export type raw = normalType | videoInfo;
export type itemType = "normal" | "ytdl";

export class Item {
    public id: string;
    public title: string;
    public url: string;
    public author: { id: string | undefined; name: string | undefined; url: string | undefined };
    public bestThumbnailURL: string | undefined;
    public constructor(public raw: raw, protected readonly _type: itemType) {
        Object.defineProperty(this, "_type", { enumerable: false });

        this.id = _type === "normal" ? (raw as normalType).id : (raw as videoInfo).videoDetails.videoId;

        this.title = _type === "normal" ? (raw as normalType).title : (raw as videoInfo).videoDetails.title;

        this.url = _type === "normal" ? (raw as normalType).url : (raw as videoInfo).videoDetails.video_url;

        this.author = {
            id: _type === "normal" ? (raw as normalType).author?.channelID : (raw as videoInfo).videoDetails.author.id,
            url: _type === "normal" ? (raw as normalType).author?.url : (raw as videoInfo).videoDetails.author.channel_url,
            name: _type === "normal" ? (raw as normalType).author?.name : (raw as videoInfo).videoDetails.author.name
        };

        this.bestThumbnailURL = _type === "normal" ? (raw as normalType).bestThumbnail.url ?? undefined : (raw as videoInfo).videoDetails.thumbnails.at(-1)!.url;
    }
}
