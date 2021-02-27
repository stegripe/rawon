import { Video as APIVideo } from "../utils/YouTubeAPI/structures/Video";
import { Playlist as APIPlaylist } from "../utils/YouTubeAPI/structures/Playlist";
import { Playlist as SRPlaylist, Video as SRVideo } from "youtube-sr";

export class Item {
    public id: string;
    public title: string;
    public url: string;
    public constructor(protected readonly rawData: APIVideo | SRVideo | APIPlaylist | SRPlaylist, protected readonly type: "api" | "scrape") {
        this.id = type === "api" ? (rawData as APIVideo).id : (rawData as SRVideo).id!;

        this.title = rawData.title!;

        this.url = type === "api" ? (rawData as APIVideo).url : (rawData as SRVideo).url;
    }
}
