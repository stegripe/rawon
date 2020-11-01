import got from "got";
import URL from "url";
import querystring from "querystring";
import { Playlist } from "./structures/Playlist";
import { Video } from "./structures/Video";
import type { Response } from "got";

export class YoutubeAPI {
    public readonly request = got;
    public constructor(key: string) {
        this.request = got.extend({
            prefixUrl: "https://www.googleapis.com/youtube/v3/",
            searchParams: { key, part: "snippet,id,status,contentDetails" },
            responseType: "json"
        });
    }

    public async getVideo(id: string): Promise<Video> {
        const raw: bodyAny = await this.request.get("videos", { searchParams: { id, maxResults: 1 } });
        return new Video(this, await raw.body.items[0]);
    }

    public getVideoByURL(url: string): Promise<Video> {
        const id = querystring.parse(URL.parse(url).query!).v as string;
        return this.getVideo(id);
    }

    public async getPlaylist(id: string): Promise<Playlist> {
        const raw: bodyAny = await this.request.get("playlists", { searchParams: { id, maxResults: 1 } });
        return new Playlist(this, raw.body.items[0]);
    }

    public getPlaylistByURL(url: string): Promise<Playlist> {
        const id = querystring.parse(URL.parse(url).query!).list as string;
        return this.getPlaylist(id);
    }

    public async searchVideos(q: string, maxResults = 5): Promise<Video[]> {
        let pageToken: string | null = "";
        const videos = [];
        while (videos.length !== maxResults) {
            let searchParams = { maxResults, part: "snippet", q, safeSearch: "none", type: "video" };
            if (pageToken !== null) searchParams = Object.assign(searchParams, { pageToken });
            try {
                const raw: bodyAny = await this.request.get("search", { searchParams: { maxResults, part: "snippet", q, safeSearch: "none", type: "video" } });
                pageToken = raw.body.nextPageToken;
                for (const item of raw.body.items) { videos.push(item); }
            } catch (error) {
                throw new Error(error);
            }
        }
        return videos.map((i: any) => new Video(this, i, "searchResults"));
    }
}

export interface bodyAny extends Response<string> {
    body: any;
}
