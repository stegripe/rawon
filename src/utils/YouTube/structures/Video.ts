import { Video as APIVideo } from "../utils/YouTubeAPI/structures/Video";
import { Video as SRVideo } from "youtube-sr";
import { Item } from "./Item";
import parse from "parse-ms";

export class Video extends Item {
    public channel: { id: string; name: string; url: string };
    public duration: parse.Parsed | null;
    public isPrivate: boolean;
    public thumbnailURL: string;
    public constructor(protected readonly rawData: APIVideo | SRVideo, protected readonly type: "api" | "scrape") {
        super(rawData, type);

        this.channel = {
            id: type === "api" ? (rawData as APIVideo).channel.id : (rawData as SRVideo).channel!.id!,
            name: type === "api" ? (rawData as APIVideo).channel.name : (rawData as SRVideo).channel!.name!,
            url: type === "api" ? (rawData as APIVideo).channel.url : (rawData as SRVideo).channel!.url!
        };

        // TODO: API Should always fetch Videos.
        this.duration = type === "api" ? (rawData as APIVideo).durationMS ? parse((rawData as APIVideo).durationMS!) : null : parse((rawData as SRVideo).duration);

        this.isPrivate = type === "api" ? (rawData as APIVideo).status.privacyStatus === "private" : false;

        this.thumbnailURL = type === "api" ? (rawData as APIVideo).thumbnailURL! : (rawData as SRVideo).thumbnail!.displayThumbnailURL("maxresdefault");
    }
}
