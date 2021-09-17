import { Video as APIVideo } from "../utils/YouTubeAPI/structures/Video";
import { IMusicInfo } from "../downloader";
import { Item } from "./Item";
import { itemType } from "..";
import { Video as SRVideo } from "ytsr";
import parse from "parse-ms";

export class Video extends Item {
    public channel: { id: string; name: string; url: string };
    public duration: parse.Parsed | null;
    public isPrivate: boolean;
    public thumbnailURL: string;
    public constructor(protected readonly rawData: APIVideo | SRVideo | IMusicInfo, protected readonly type: itemType) {
        super(rawData, type);

        this.channel = {
            id: type === "api"
                ? (rawData as APIVideo).channel.id
                : type === "scrape"
                    ? (rawData as SRVideo).author!.channelID
                    : (rawData as IMusicInfo).videoDetails.author.id,
            name: type === "api"
                ? (rawData as APIVideo).channel.name
                : type === "scrape"
                    ? (rawData as SRVideo).author!.name
                    : (rawData as IMusicInfo).videoDetails.author.name,
            url: type === "api"
                ? (rawData as APIVideo).channel.url
                : type === "scrape"
                    ? (rawData as SRVideo).author!.url
                    : (rawData as IMusicInfo).videoDetails.author.name
        };

        this.duration = type === "api"
            ? (rawData as APIVideo).durationMS
                ? parse((rawData as APIVideo).durationMS!)
                : null
            : type === "scrape"
                ? (rawData as SRVideo).duration ? parse(this.durationToMS((rawData as SRVideo).duration)) : null
                : (rawData as IMusicInfo).videoDetails.isLiveContent ? parse(Number((rawData as IMusicInfo).videoDetails.lengthSeconds) * 1000) : null;

        this.isPrivate = type === "api" ? (rawData as APIVideo).status.privacyStatus === "private" : false;

        this.thumbnailURL = type === "api"
            ? (rawData as APIVideo).thumbnailURL!
            : type === "scrape"
                ? (rawData as SRVideo).bestThumbnail.url!
                : (rawData as IMusicInfo).videoDetails.thumbnails[(rawData as IMusicInfo).videoDetails.thumbnails.length - 1].url;
    }

    private durationToMS(duration: string | null): number {
        if (duration === null) return 0;

        const seconds = duration.split(":").reduce((acc, time) => (60 * acc) + Number(time), 0);

        return seconds * 1000;
    }
}
