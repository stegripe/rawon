import { YoutubeAPI } from "./utils/YouTubeAPI";
import { IMusicData, playMusic, IdownloadOptions } from "./downloader";
import { Video } from "./structures/Video";
import { Playlist } from "./structures/Playlist";

export class YouTube {
    private readonly engine: YoutubeAPI | undefined;
    public constructor(private readonly mode: "api" | "scrape", private readonly apiKey?: string) {
        Object.defineProperty(this, "apiKey", {
            enumerable: false,
            writable: false
        });
        if (mode === "scrape") {
            this.engine = undefined;
            throw new Error("scraping mode is not implemented yet.");
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        } else if (mode === "api") {
            if (!apiKey) throw new Error("Missing API Key for mode: api");
            this.engine = new YoutubeAPI(apiKey);
        } else {
            throw new Error("Unknown mode! Available modes are 'api' and 'scrape'.");
        }
    }

    public downloadVideo(link: string, options?: IdownloadOptions): Promise<IMusicData> {
        return playMusic(link, options);
    }

    public async getVideo(id: string): Promise<Video> {
        const data = await this.engine!.getVideo(id);
        return new Video(data);
    }

    public async getPlaylist(id: string): Promise<Playlist> {
        const data = await this.engine!.getPlaylist(id);
        return new Playlist(data);
    }

    public async searchVideos(query: string, maxResults = 5): Promise<Video[]> {
        const data = await this.engine!.searchVideos(query, maxResults);
        return data.map(i => new Video(i));
    }
}
