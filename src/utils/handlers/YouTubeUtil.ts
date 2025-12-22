import process from "node:process";
import YTI, { MusicClient } from "youtubei";

const { Client } = YTI;

const youtubeOAuthRefreshToken = process.env.YOUTUBE_OAUTH_REFRESH_TOKEN ?? "";

// Initialize YouTube clients with OAuth if refresh token is provided
const clientOptions =
    youtubeOAuthRefreshToken.length > 0
        ? {
              oauth: {
                  enabled: true,
                  refreshToken: youtubeOAuthRefreshToken,
              },
          }
        : undefined;

export const youtube = new Client(clientOptions);
export const youtubeMusic = new MusicClient(clientOptions);
