import { Video as APIVideo } from "../utils/YouTubeAPI/structures/Video";
import { Video as SRVideo } from "youtube-sr";
import { Item } from "./Item";
import parse from "parse-ms";
import { YTDLInfo } from "..";

export class Video extends Item {
    public channel: { id: string; name: string; url: string };
    public duration: parse.Parsed | null;
    public isPrivate: boolean;
    public thumbnailURL: string;
    public constructor(protected readonly rawData: APIVideo | YTDLInfo | SRVideo, protected readonly type: "api" | "scrape" | "ytdl") {
        super(rawData, type);
        this.channel = {
            id: type === "api"
                ? (rawData as APIVideo).channel.id
                : type === "scrape" ? (rawData as SRVideo).channel!.id! : (rawData as YTDLInfo).author.id,
            name: type === "api"
                ? (rawData as APIVideo).channel.name
                : type === "scrape" ? (rawData as SRVideo).channel!.name! : (rawData as YTDLInfo).author.name,
            url: type === "api"
                ? (rawData as APIVideo).channel.url
                : type === "scrape" ? (rawData as SRVideo).channel!.url! : (rawData as YTDLInfo).author.channel_url
        };
        // NOTE: API Should always fetch Videos.
        this.duration = type === "api"
            ? (rawData as APIVideo).durationMS ? parse((rawData as APIVideo).durationMS!) : null
            : type === "scrape" ? parse((rawData as SRVideo).duration) : parse(Number((rawData as YTDLInfo).lengthSeconds) * 1000);

        this.isPrivate = type === "api"
            ? (rawData as APIVideo).status.privacyStatus === "private"
            : type === "scrape" ? false : (rawData as YTDLInfo).isPrivate;

        this.thumbnailURL = type === "api"
            ? (rawData as APIVideo).thumbnailURL!
            : type === "scrape" ? (rawData as SRVideo).thumbnail!.displayThumbnailURL("maxresdefault") : (rawData as YTDLInfo).thumbnails[(rawData as YTDLInfo).thumbnails.length - 1].url;
    }
}
