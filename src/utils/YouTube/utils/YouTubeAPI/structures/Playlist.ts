import { IPlaylist } from "../types";
import { Video } from "./Video";
import { YoutubeAPI } from "..";

export class Playlist implements IPlaylist {
    public id: IPlaylist["id"];
    public url: IPlaylist["url"];
    public title: IPlaylist["title"];
    public description: IPlaylist["description"];
    public channel: IPlaylist["channel"];
    public thumbnails: IPlaylist["thumbnails"];
    public itemCount: IPlaylist["itemCount"];
    public privacyStatus: IPlaylist["privacyStatus"];
    public createdAt: IPlaylist["createdAt"];
    public constructor(public yt: YoutubeAPI, public raw: IPlaylist["raw"]) {
        this.id = raw.id;
        this.url = `https://youtube.com/playlist?vlist=${this.id}`;
        this.title = raw.snippet.title;
        this.description = raw.snippet.description;
        this.channel = {
            id: raw.snippet.channelId,
            name: raw.snippet.channelTitle,
            url: `https://www.youtube.com/channel/${raw.snippet.channelId}`
        };
        this.thumbnails = raw.snippet.thumbnails;
        this.itemCount = raw.contentDetails.itemCount;
        this.privacyStatus = raw.status.privacyStatus;
        this.createdAt = new Date(raw.snippet.publishedAt);
    }

    public async getVideos(): Promise<Video[]> {
        const videos: any[] = await this.yt.makePaginatedRequest("playlistItems", { maxResults: 50, playlistId: this.id }, this.itemCount);
        return videos
            .filter((i: any) => i.status.privacyStatus !== "privacyStatusUnspecified")
            .map((i: any) => new Video(this.yt, i, "playlistItem"));
    }

    public get thumbnailURL(): string | null {
        if (Object.keys(this.thumbnails).length === 0) return null;
        return (this.thumbnails.maxres ?? this.thumbnails.high ?? this.thumbnails.medium ?? this.thumbnails.standard ?? this.thumbnails.default).url;
    }
}
