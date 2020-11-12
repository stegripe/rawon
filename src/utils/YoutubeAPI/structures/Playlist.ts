/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { Options } from "got";
import { YoutubeAPI, bodyAny } from "..";
import { IPlaylist, IVideo } from "../types";
import { Video } from "./Video";

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
        this.url = `https://youtube.com/playlist?vlist=${raw.id}`;
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

    public async getVideos(): Promise<IVideo[]> {
        const videos = await this.yt.request.paginate.all("playlistItems", {
            searchParams: { maxResults: 50, playlistId: this.id },
            pagination: {
                paginate: (response: bodyAny, allItems): Options | false => {
                    const { nextPageToken, prevPageToken } = response.body;
                    if (nextPageToken === prevPageToken) return false;
                    if (allItems.length >= this.itemCount) return false;

                    return {
                        searchParams: {
                            ...response.request.options.searchParams,
                            pageToken: nextPageToken
                        }
                    };
                },
                transform: (response: bodyAny) => response.body.items,
                countLimit: this.itemCount
            }
        });
        return videos.map((i: any) => new Video(this.yt, i, "playlistItem"));
    }
}
