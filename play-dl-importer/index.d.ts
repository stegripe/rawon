import { Readable } from "node:stream";

export default {
    stream: async (url: string, options: { discordPlayerCompatibility: boolean }): Promise<{ stream: Readable }> => {},
    video_basic_info: async (url: string): Promise<{
        video_details: {
            durationInSec: number;
            id: string | null;
            thumbnails: { url: string; width: number; height: number }[];
            title: string | null;
            url: string;
        }
    }> => {}
};
