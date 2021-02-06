import { Playlist as APIPlaylist } from "../utils/YouTubeAPI/structures/Playlist";
import { Playlist as SRPlaylist } from "youtube-sr";
import { Item } from "./Item";
import { Video } from "./Video";

export class Playlist extends Item {
    public channel: APIPlaylist["channel"];
    public itemCount: APIPlaylist["itemCount"];
    public thumbnailURL: string;
    public constructor(protected readonly rawData: APIPlaylist | SRPlaylist, protected readonly type: "api" | "scrape") {
        super(rawData, type);
        this.channel = {
            id: type === "api" ? (rawData as APIPlaylist).channel.id : (rawData as SRPlaylist).channel!.id!,
            name: type === "api" ? (rawData as APIPlaylist).channel.name : (rawData as SRPlaylist).channel!.name!,
            url: type === "api" ? (rawData as APIPlaylist).channel.url : (rawData as SRPlaylist).channel!.url!
        };
        this.itemCount = type === "api" ? (rawData as APIPlaylist).itemCount : (rawData as SRPlaylist).videoCount;

        this.thumbnailURL = type === "api"
            ? (rawData as APIPlaylist).thumbnailURL!
            : (rawData as SRPlaylist).thumbnail! as unknown as string;
    }

    public async getVideos(): Promise<Video[]> {
        let videos;
        if (this.type === "api") videos = await (this.rawData as APIPlaylist).getVideos();
        else videos = (this.rawData as SRPlaylist).videos;
        // @ts-expect-error IGNORE
        return videos.map(i => new Video(i, this.type));
    }
}
