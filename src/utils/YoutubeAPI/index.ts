/* eslint-disable @typescript-eslint/explicit-function-return-type */
import got from "got";
import { parse as parseURL } from "url";
import { parse as parseQuery } from "querystring";
import { Playlist } from "./structures/Playlist";
import { Video } from "./structures/Video";

export class YoutubeAPI {
    private readonly request = got;
    public constructor(key: string) {
        this.request = got.extend({
            prefixUrl: "https://www.googleapis.com/youtube/v3/",
            searchParams: { key, part: "snippet,id,status,contentDetails" },
            responseType: "json"
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

    public makeRequest(endpoint: string, searchParams: Record<string, any>): Promise<any> {
        return this.request.get<any>(endpoint, { searchParams }).then(res => res.body).catch(e => Promise.reject(e));
    }

    public makePaginatedRequest(endpoint: string, searchParams: Record<string, any>, count: number): Promise<any> {
        return this.request.paginate.all<any, any>(endpoint, {
            searchParams,
            pagination: {
                paginate: (response, allItems) => {
                    const { nextPageToken, prevPageToken } = response.body;
                    if (nextPageToken === prevPageToken) return false;
                    if (!nextPageToken) return false;
                    if (allItems.length > count) return false;

                    return {
                        searchParams: {
                            ...response.request.options.searchParams,
                            pageToken: nextPageToken
                        }
                    };
                },
                transform: response => response.body.items,
                countLimit: count
            }
        });
    }

    public async searchVideos(q: string, maxResults = 5): Promise<Video[]> {
        const videos = await this.makePaginatedRequest("search", { maxResults, part: "snippet", q, safeSearch: "none", type: "video" }, maxResults);
        return videos.map((i: any) => new Video(this, i, "searchResults"));
    }
}
