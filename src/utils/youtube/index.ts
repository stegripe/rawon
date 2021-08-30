import { resolveYTPlaylistID } from "./utils/resolveYTURL";
import { YouTubeError } from "./utils/YouTubeError";
import { Playlist } from "./structures/Playlist";
import { Video } from "./structures/Video";
import { getInfo } from "ytdl-core";
import ytsr, { Video as IVideo } from "ytsr";
import ytpl from "ytpl";

// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class YouTube {
    public static async getVideo(url: string): Promise<Video> {
        try {
            const data = await getInfo(url);
            return new Video(data, "ytdl");
        } catch (error) {
            throw new YouTubeError("Could not get video data", error);
        }
    }

    public static async getPlaylist(url: string): Promise<Playlist> {
        try {
            const id = resolveYTPlaylistID(url);
            if (!id) throw new Error(`Could not extract Playlist ID from url, URL is: ${url}`);
            const data = await ytpl(id);
            return new Playlist(data, "normal");
        } catch (error) {
            throw new YouTubeError("Could not get playlist data", error);
        }
    }

    public static async searchVideos(query: string, maxResults = 10): Promise<Video[]> {
        try {
            const data = await ytsr(query, { limit: maxResults, safeSearch: false });
            return data.items.filter(x => x.type === "video").map(i => new Video(i as IVideo, "normal"));
        } catch (error) {
            throw new YouTubeError("Could not get search data", error);
        }
    }
}
