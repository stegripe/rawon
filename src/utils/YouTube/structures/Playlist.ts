import { Playlist as APIPlaylist } from "../utils/YouTubeAPI/structures/Playlist";
import { Item } from "./Item";
import { Video } from "./Video";

export class Playlist extends Item {
    public channel: APIPlaylist["channel"];
    public itemCount: APIPlaylist["itemCount"];
    public constructor(protected readonly rawData: APIPlaylist) {
        super(rawData);
        this.channel = rawData.channel;
        this.itemCount = rawData.itemCount;
    }

    public async getVideos(): Promise<Video[]> {
        const videos = await this.rawData.getVideos();
        return videos.map(i => new Video(i));
    }
}
