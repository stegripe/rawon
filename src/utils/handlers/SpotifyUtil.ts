import { Buffer } from "node:buffer";
import { setTimeout } from "node:timers";
import { clientId, clientSecret } from "../../config/env.js";
import { type Rawon } from "../../structures/Rawon.js";
import { type SpotifyAlbum, type SpotifyPlaylist, type SpotifyTrack } from "../../typings/index.js";

export class SpotifyUtil {
    public spotifyRegex =
        /(?:https:\/\/open\.spotify\.com\/|spotify:)(?:.+)?(?<type>track|playlist|album)[/:](?<id>[\dA-Za-z]+)/u;
    public baseURI = "https://api.spotify.com/v1";
    private token!: string;

    public constructor(public client: Rawon) {}

    public async fetchTokenWithRetries(retries = 3): Promise<number> {
        if (!clientId || !clientSecret) {
            throw new Error("[SpotifyUtil] Missing Spotify credentials in environment variables.");
        }
        const authString = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                // eslint-disable-next-line no-await-in-loop
                const tokenData: unknown = await this.client.request
                    .post("https://accounts.spotify.com/api/token", {
                        headers: {
                            "Content-Type": "application/x-www-form-urlencoded",
                            Authorization: `Basic ${authString}`,
                        },
                        body: "grant_type=client_credentials",
                    })
                    .json();

                if (typeof tokenData !== "object" || tokenData === null) {
                    throw new TypeError("[SpotifyUtil] Invalid token data");
                }
                const tokenDataObj = tokenData as Record<string, unknown>;
                if (
                    typeof tokenDataObj.access_token !== "string" ||
                    typeof tokenDataObj.expires_in !== "number"
                ) {
                    throw new TypeError("[SpotifyUtil] Invalid token data format");
                }

                const tokenResponse = {
                    accessToken: tokenDataObj.access_token,
                    expiresIn: tokenDataObj.expires_in,
                };

                const { accessToken, expiresIn } = tokenResponse;
                if (!accessToken || accessToken.length === 0) {
                    throw new Error("[SpotifyUtil] Could not fetch Spotify token.");
                }
                this.token = `Bearer ${accessToken}`;
                const expiresInMs = expiresIn * 1_000;
                return expiresInMs - 300_000;
            } catch (error) {
                if (attempt === retries) {
                    this.client.logger.error(
                        `[SpotifyUtil] Failed to fetch Spotify token after ${retries} attempts: `,
                        error,
                    );
                    throw error;
                }
                this.client.logger.warn(`[SpotifyUtil] Attempt ${attempt} failed. Retrying...`);
            }
        }
        throw new Error("[SpotifyUtil] Failed to fetch Spotify token after retries.");
    }

    public async renew(): Promise<void> {
        try {
            const renewInterval = await this.fetchTokenWithRetries();
            this.client.logger.info(`[SpotifyUtil] Token fetched successfully.`);
            this.client.logger.info(
                `[SpotifyUtil] Renewing token in ${(renewInterval / 1_000 / 60).toFixed(2)} minutes.`,
            );
            setTimeout(async () => this.renew(), renewInterval);
        } catch (error) {
            this.client.logger.error("[SpotifyUtil] Failed to renew Spotify token: ", error);
        }
    }

    public resolveTracks(
        url: string,
    ): Promise<{ track: SpotifyTrack }[]> | Promise<SpotifyTrack> | undefined {
        const [, type, id] = this.spotifyRegex.exec(url) ?? [];

        switch (type) {
            case "track":
                return this.getTrack(id);
            case "playlist":
                return this.getPlaylist(id);
            case "album":
                return this.getAlbum(id);
            default:
                break;
        }
        return undefined;
    }

    public async getAlbum(id: string): Promise<{ track: SpotifyTrack }[]> {
        const albumResponse = await this.client.request
            .get(`${this.baseURI}/albums/${id}`, {
                headers: {
                    Authorization: this.token,
                },
            })
            .json<SpotifyAlbum>();

        let next = albumResponse.tracks.next;

        while (next !== null && next !== undefined) {
            // eslint-disable-next-line no-await-in-loop
            const nextPlaylistResponse = await this.client.request
                .get(next, {
                    headers: {
                        Authorization: this.token,
                    },
                })
                .json<SpotifyAlbum["tracks"]>();
            next = nextPlaylistResponse.next;
            albumResponse.tracks.items.push(...nextPlaylistResponse.items);
        }
        return albumResponse.tracks.items.filter(Boolean).map((track) => ({ track }));
    }

    public async getPlaylist(id: string): Promise<{ track: SpotifyTrack }[]> {
        const playlistResponse = await this.client.request
            .get(`${this.baseURI}/playlists/${id}`, {
                headers: { Authorization: this.token },
            })
            .json<SpotifyPlaylist>();

        let allItems = playlistResponse.tracks.items;
        let next = playlistResponse.tracks.next;

        while (next !== null && next !== undefined) {
            // eslint-disable-next-line no-await-in-loop
            const nextPlaylistResponse = await this.client.request
                .get(next, {
                    headers: { Authorization: this.token },
                })
                .json<SpotifyPlaylist["tracks"]>();

            allItems = [...allItems, ...nextPlaylistResponse.items];
            next = nextPlaylistResponse.next;
        }

        return allItems.map((item) => ({ track: item.track }));
    }

    public async getTrack(id: string): Promise<SpotifyTrack> {
        return this.client.request
            .get(`${this.baseURI}/tracks/${id}`, {
                headers: {
                    Authorization: this.token,
                },
            })
            .json<SpotifyTrack>();
    }
}
