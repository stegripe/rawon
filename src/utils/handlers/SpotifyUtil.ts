import { Buffer } from "node:buffer";
import { setTimeout } from "node:timers";
import { clientId, clientSecret } from "../../config/env.js";
import { type Rawon } from "../../structures/Rawon.js";
import {
    type PlaylistMetadata,
    type SpotifyAlbum,
    type SpotifyPlaylist,
    type SpotifyResolveResult,
    type SpotifyTrack,
} from "../../typings/index.js";

export class SpotifyUtil {
    public spotifyRegex =
        /(?:https:\/\/open\.spotify\.com\/|spotify:)(?:.+)?(?<type>track|playlist|album|artist)[/:](?<id>[\dA-Za-z]+)/u;
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
            const safeInterval = Math.max(renewInterval, 60_000);
            this.client.logger.info(
                `[SpotifyUtil] Renewing token in ${(safeInterval / 1_000 / 60).toFixed(2)} minutes.`,
            );
            setTimeout(async () => this.renew(), safeInterval);
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
            case "artist":
                return this.getArtistTopTracks(id);
            default:
                break;
        }
        return undefined;
    }

    public async resolveTracksWithMetadata(
        url: string,
    ): Promise<SpotifyResolveResult | SpotifyTrack | undefined> {
        const [, type, id] = this.spotifyRegex.exec(url) ?? [];

        switch (type) {
            case "track":
                return this.getTrack(id);
            case "playlist":
                return this.getPlaylistWithMetadata(id);
            case "album":
                return this.getAlbumWithMetadata(id);
            case "artist":
                return this.getArtistTopTracksWithMetadata(id);
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

    public async getAlbumWithMetadata(id: string): Promise<SpotifyResolveResult> {
        const albumResponse = await this.client.request
            .get(`${this.baseURI}/albums/${id}`, {
                headers: {
                    Authorization: this.token,
                },
            })
            .json<SpotifyAlbum>();

        let next = albumResponse.tracks.next;

        while (next !== null && next !== undefined) {
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

        const metadata: PlaylistMetadata = {
            title: albumResponse.name,
            url: albumResponse.external_urls?.spotify ?? `https://open.spotify.com/album/${id}`,
            thumbnail: albumResponse.images?.[0]?.url,
            author: albumResponse.artists?.map((a) => a.name).join(", "),
        };

        return {
            tracks: albumResponse.tracks.items.filter(Boolean).map((track) => ({ track })),
            metadata,
        };
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
            const nextPlaylistResponse = await this.client.request
                .get(next, {
                    headers: { Authorization: this.token },
                })
                .json<SpotifyPlaylist["tracks"]>();

            allItems = [...allItems, ...nextPlaylistResponse.items];
            next = nextPlaylistResponse.next;
        }

        return allItems
            .filter((item) => item.track !== null && item.track !== undefined)
            .map((item) => ({ track: item.track }));
    }

    public async getPlaylistWithMetadata(id: string): Promise<SpotifyResolveResult> {
        const playlistResponse = await this.client.request
            .get(`${this.baseURI}/playlists/${id}`, {
                headers: { Authorization: this.token },
            })
            .json<SpotifyPlaylist>();

        let allItems = playlistResponse.tracks.items;
        let next = playlistResponse.tracks.next;

        while (next !== null && next !== undefined) {
            const nextPlaylistResponse = await this.client.request
                .get(next, {
                    headers: { Authorization: this.token },
                })
                .json<SpotifyPlaylist["tracks"]>();

            allItems = [...allItems, ...nextPlaylistResponse.items];
            next = nextPlaylistResponse.next;
        }

        const metadata: PlaylistMetadata = {
            title: playlistResponse.name,
            url:
                playlistResponse.external_urls?.spotify ??
                `https://open.spotify.com/playlist/${id}`,
            thumbnail: playlistResponse.images?.[0]?.url,
            author: playlistResponse.owner?.display_name,
        };

        return {
            tracks: allItems
                .filter((item) => item.track !== null && item.track !== undefined)
                .map((item) => ({ track: item.track })),
            metadata,
        };
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

    public async getArtistTopTracks(id: string): Promise<{ track: SpotifyTrack }[]> {
        const artistResponse = await this.client.request
            .get(`${this.baseURI}/artists/${id}/top-tracks`, {
                headers: {
                    Authorization: this.token,
                },
            })
            .json<SpotifyArtist>();

        return artistResponse.tracks.filter(Boolean).map((track) => ({ track }));
    }

    public async getArtistTopTracksWithMetadata(id: string): Promise<SpotifyResolveResult> {
        const [artistInfo, artistResponse] = await Promise.all([
            this.client.request
                .get(`${this.baseURI}/artists/${id}`, {
                    headers: {
                        Authorization: this.token,
                    },
                })
                .json<{ name: string }>(),
            this.client.request
                .get(`${this.baseURI}/artists/${id}/top-tracks`, {
                    headers: {
                        Authorization: this.token,
                    },
                })
                .json<SpotifyArtist>(),
        ]);

        const metadata: PlaylistMetadata = {
            title: `${artistInfo.name} — Top Tracks`,
            url: `https://open.spotify.com/artist/${id}`,
        };

        return {
            tracks: artistResponse.tracks.filter(Boolean).map((track) => ({ track })),
            metadata,
        };
    }
}
