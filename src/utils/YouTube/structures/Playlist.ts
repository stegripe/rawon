import { Playlist as APIPlaylist } from "../utils/YouTubeAPI/structures/Playlist";
import { Video } from "./Video";
import { Item } from "./Item";
import { itemType } from "..";
import { Result as SRPlaylist } from "ytpl";

export class Playlist extends Item {
    public channel: APIPlaylist["channel"];
    public itemCount: APIPlaylist["itemCount"];
    public thumbnailURL: string;
    public constructor(protected readonly rawData: APIPlaylist | SRPlaylist, protected readonly type: itemType) {
        super(rawData, type);

        this.channel = {
            id: type === "api" ? (rawData as APIPlaylist).channel.id : (rawData as SRPlaylist).author.channelID,
            name: type === "api" ? (rawData as APIPlaylist).channel.name : (rawData as SRPlaylist).author.name,
            url: type === "api" ? (rawData as APIPlaylist).channel.url : (rawData as SRPlaylist).author.url
        };

        this.itemCount = type === "api" ? (rawData as APIPlaylist).itemCount : (rawData as SRPlaylist).items.length;

        this.thumbnailURL = type === "api" ? (rawData as APIPlaylist).thumbnailURL! : (rawData as SRPlaylist).bestThumbnail.url! as unknown as string;
    }

    public async getVideos(): Promise<Video[]> {
        let videos;
        if (this.type === "api") videos = await (this.rawData as APIPlaylist).getVideos();
        else videos = (this.rawData as SRPlaylist).items;
        return videos.map((i: any) => new Video(i, this.type));
    }
}
