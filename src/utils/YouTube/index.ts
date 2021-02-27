import { YoutubeAPI } from "./utils/YouTubeAPI";
import { YouTube as YouTubeSR } from "youtube-sr";
import { IMusicData, playMusic, IdownloadOptions } from "./downloader";
import { Video } from "./structures/Video";
import { Playlist } from "./structures/Playlist";

export class YouTube {
    private readonly engine: YoutubeAPI | YouTubeSR | undefined;
    public constructor(private readonly mode?: "api" | "scrape", private readonly apiKey?: string) {
        Object.defineProperty(this, "apiKey", {
            enumerable: false,
            writable: false
        });
        if (mode === "api") {
            if (!apiKey) throw new Error("Missing API Key for mode: api");
            this.engine = new YoutubeAPI(apiKey);
        } else if (mode === "scrape") {
            this.engine = YouTubeSR;
        } else {
            throw new Error("Unknown mode! Available modes are 'api' and 'scrape'.");
        }
    }

    public downloadVideo(link: string, options?: IdownloadOptions): Promise<IMusicData> {
        return playMusic(link, options);
    }

    public async getVideo(id: string): Promise<Video> {
        let data;
        if (this.mode === "api") data = await (this.engine as YoutubeAPI).getVideo(id);
        if (this.mode === "scrape") data = (await YouTubeSR.getVideo(`https://youtube.com/watch?v=${id}`));
        if (data === undefined) throw new Error("I could not get any data!");
        return new Video(data, this.mode!);
    }

    public async getPlaylist(id: string): Promise<Playlist> {
        let data;
        if (this.mode === "api") data = await (this.engine as YoutubeAPI).getPlaylist(id);
        if (this.mode === "scrape") data = (await YouTubeSR.getPlaylist(`https://youtube.com/playlist?list=${id}`));
        if (data === undefined) throw new Error("I could not get any data!");
        return new Playlist(data, this.mode!);
    }

    public async searchVideos(query: string, maxResults = 5): Promise<Video[]> {
        let data;
        if (this.mode === "api") data = await (this.engine as YoutubeAPI).searchVideos(query, maxResults);
        if (this.mode === "scrape") data = (await YouTubeSR.search(query, { type: "video", limit: maxResults }));
        if (data === undefined) throw new Error("I could not get any data!");
        return data.map((i: any) => new Video(i, this.mode!));
    }
}
