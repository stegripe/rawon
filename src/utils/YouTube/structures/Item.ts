/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
import { itemType } from "..";
import { Video as APIVideo } from "../utils/YouTubeAPI/structures/Video";
import { Video as SRVideo } from "ytsr";
import { Playlist as APIPlaylist } from "../utils/YouTubeAPI/structures/Playlist";
import { Result as SRPlaylist } from "ytpl";
import { IMusicInfo } from "../downloader";

export class Item {
    public id: string;
    public title: string;
    public url: string;
    public constructor(protected readonly rawData: APIVideo | SRVideo | APIPlaylist | SRPlaylist | IMusicInfo, protected readonly type: itemType) {
        this.id = type === "ytdl-core" ? (rawData as IMusicInfo).videoDetails.videoId : (rawData as APIVideo | SRVideo).id;

        this.title = type === "ytdl-core" ? (rawData as IMusicInfo).videoDetails.title : (rawData as APIVideo | SRVideo).title;

        this.url = type === "ytdl-core" ? (rawData as IMusicInfo).videoDetails.video_url : (rawData as APIVideo | SRVideo).url;
    }
}
