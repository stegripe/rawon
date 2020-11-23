/* eslint-disable @typescript-eslint/explicit-function-return-type */
import fetch from "node-fetch";
import { parse as parseURL, resolve as resolveURL } from "url";
import { parse as parseQuery, stringify as stringifyQuery, ParsedUrlQueryInput } from "querystring";
import { Playlist } from "./structures/Playlist";
import { Video } from "./structures/Video";

export class YoutubeAPI {
    private readonly baseURL = "https://www.googleapis.com/youtube/v3/";
    public constructor(private readonly key: string) {
        Object.defineProperty(this, "key", {
            enumerable: false,
            writable: false
        });
    }

    public async getVideo(id: string): Promise<Video> {
        const raw = await this.makeRequest("videos", { id, maxResults: 1 });
        return new Video(this, await raw.items[0]);
    }

    public getVideoByURL(url: string): Promise<Video> {
        const id = parseQuery(parseURL(url).query!).v as string;
        return this.getVideo(id);
    }

    public async getPlaylist(id: string): Promise<Playlist> {
        const raw = await this.makeRequest("playlists", { id, maxResults: 1 });
        return new Playlist(this, raw.items[0]);
    }

    public getPlaylistByURL(url: string): Promise<Playlist> {
        const id = parseQuery(parseURL(url).query!).list as string;
        return this.getPlaylist(id);
    }

    public makeRequest(endpoint: string, searchParams: ParsedUrlQueryInput): Promise<any> {
        const query = stringifyQuery(Object.assign({ key: this.key, part: "snippet,id,status,contentDetails" }, searchParams));
        const URI = resolveURL(resolveURL(this.baseURL, endpoint), `?${query}`);
        return fetch(URI)
            .then(res => res.json())
            .then(res => {
                if (res.error) return Promise.reject(res.error);
                return res;
            })
            .catch(e => Promise.reject(e));
    }

    public makePaginatedRequest(endpoint: string, searchParams = {}, count = Infinity, fetched = [], pageToken = null): Promise<any> {
        if (count < 1) return Promise.reject(new Error("Cannot fetch less than 1."));

        const limit = count > 50 ? 50 : count;
        return this.makeRequest(endpoint, Object.assign(searchParams, { pageToken, maxResults: limit })).then(result => {
            const results = fetched.concat(result.items);
            if (result.nextPageToken && limit !== count) return this.makePaginatedRequest(endpoint, searchParams, count - limit, results, result.nextPageToken);
            return results;
        });
    }

    public async searchVideos(q: string, maxResults = 5): Promise<Video[]> {
        const videos = await this.makePaginatedRequest("search", { maxResults, part: "snippet", q, safeSearch: "none", type: "video" }, maxResults);
        return videos.map((i: any) => new Video(this, i, "searchResults"));
    }
}
