/* eslint-disable @typescript-eslint/explicit-function-return-type */
import got, { Options, Response } from "got";
import URL from "url";
import querystring from "querystring";
import { Playlist } from "./structures/Playlist";
import { Video } from "./structures/Video";

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
        const videos = await this.request.paginate.all("search", {
            searchParams: { maxResults, part: "snippet", q, safeSearch: "none", type: "video" },
            pagination: {
                paginate: (response: bodyAny, allItems): Options | false => {
                    const { nextPageToken, prevPageToken } = response.body;
                    if (nextPageToken === prevPageToken) return false;
                    if (allItems.length >= maxResults) return false;

                    return {
                        searchParams: {
                            ...response.request.options.searchParams,
                            pageToken: nextPageToken
                        }
                    };
                },
                transform: (response: bodyAny) => response.body.items,
                countLimit: maxResults
            }
        });
        return videos.map((i: any) => new Video(this, i, "searchResults"));
    }
}

export interface bodyAny extends Response<string> {
    body: any;
}
