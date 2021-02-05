import { YoutubeAPI } from "./YoutubeAPI";
import { Playlist } from "./YoutubeAPI/structures/Playlist";
import { Video } from "./YoutubeAPI/structures/Video";
import { IMusicData, playMusic, IdownloadOptions } from "./YouTubeDownload";

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

    public getVideo(id: string): Promise<Video> {
        return this.engine!.getVideo(id);
    }

    public getPlaylist(id: string): Promise<Playlist> {
        return this.engine!.getPlaylist(id);
    }

    public searchVideos(query: string, maxResults = 5): Promise<Video[]> {
        return this.engine!.searchVideos(query, maxResults);
    }
}
