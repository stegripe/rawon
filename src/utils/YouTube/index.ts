import { IMusicData, playMusic, IdownloadOptions, getMusicInfo } from "./downloader";
import { Playlist } from "./structures/Playlist";
import { YoutubeAPI } from "./utils/YouTubeAPI";
import { Video } from "./structures/Video";
import ytsr from "ytsr";
import ytpl from "ytpl";

interface scrape { search: typeof ytsr; playlist: typeof ytpl; getVideo: typeof getMusicInfo }

export type itemType = "api" | "scrape" | "ytdl-core";

export class YouTube {
    private readonly engine: YoutubeAPI | scrape | undefined;
    public constructor(private readonly mode?: itemType, private readonly apiKey?: string) {
        Object.defineProperty(this, "apiKey", {
            enumerable: false,
            writable: false
        });
        if (mode === "api") {
            if (!apiKey) throw new Error("Missing API Key for mode: api");
            this.engine = new YoutubeAPI(apiKey);
        } else if (mode === "scrape") {
            this.engine = {
                search: ytsr,
                playlist: ytpl,
                getVideo: getMusicInfo
            };
        } else {
            throw new Error("Unknown mode, available modes are 'api' and 'scrape'");
        }
    }

    public downloadVideo(link: string, options?: IdownloadOptions): Promise<IMusicData> {
        return playMusic(link, options);
    }

    public async getVideo(id: string): Promise<Video> {
        let data;
        if (this.mode === "api") data = await (this.engine as YoutubeAPI).getVideo(id);
        if (this.mode === "scrape") data = (await (this.engine as scrape).getVideo(`https://youtube.com/watch?v=${id}`));
        if (data === undefined) throw new Error("I could not get any data.");
        return new Video(data, this.mode === "scrape" ? "ytdl-core" : "api");
    }

    public async getPlaylist(id: string): Promise<Playlist> {
        let data;
        if (this.mode === "api") data = await (this.engine as YoutubeAPI).getPlaylist(id);
        if (this.mode === "scrape") data = (await (this.engine as scrape).playlist(id, { limit: Infinity }));
        if (data === undefined) throw new Error("I could not get any data.");
        return new Playlist(data, this.mode!);
    }

    public async searchVideos(query: string, maxResults = 5): Promise<Video[]> {
        let data;
        if (this.mode === "api") data = await (this.engine as YoutubeAPI).searchVideos(query, maxResults);
        if (this.mode === "scrape") data = (await (this.engine as scrape).search(query, { limit: maxResults, safeSearch: false })).items;
        if (data === undefined) throw new Error("I could not get any data.");
        // @ts-expect-error Error is expected.
        return data.filter((x: any) => {
            if (this.mode === "scrape") return x.type === "video";
            return true;
        }).map((i: any) => new Video(i, this.mode!));
    }
}
