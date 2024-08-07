/* eslint-disable no-await-in-loop */
import { setTimeout } from "node:timers";
import type { Rawon } from "../../structures/Rawon.js";
import type { SpotifyAccessTokenAPIResult, SpotifyAlbum, SpotifyPlaylist, SpotifyTrack } from "../../typings/index.js";

export class SpotifyUtil {
    // eslint-disable-next-line prefer-named-capture-group
    public spotifyRegex = /(?:https:\/\/open\.spotify\.com\/|spotify:)(?:.+)?(track|playlist|album)[/:]([\dA-Za-z]+)/u;
    public baseURI = "https://api.spotify.com/v1";
    private token!: string;

    public constructor(public client: Rawon) { }

    public async fetchToken(): Promise<number> {
        const { accessToken, accessTokenExpirationTimestampMs } = await this.client.request
            .get("https://open.spotify.com/get_access_token", {
                headers: {
                    "User-Agent":
                        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 Edg/91.0.864.59"
                }
            })
            .json<SpotifyAccessTokenAPIResult>();
        if ((accessToken?.length ?? 0) === 0) throw new Error("Could not fetch self Spotify token.");
        this.token = `Bearer ${accessToken}`;
        return new Date(accessTokenExpirationTimestampMs).getMilliseconds() * 1_000;
    }

    public async renew(): Promise<void> {
        const lastRenew = await this.fetchToken();
        setTimeout(async () => this.renew(), lastRenew);
    }

    public resolveTracks(url: string): Promise<{ track: SpotifyTrack }[]> | Promise<SpotifyTrack> | undefined {
        const [, type, id] = this.spotifyRegex.exec(url) ?? [];
        switch (type) {
            case "track": {
                return this.getTrack(id);
            }

            case "playlist": {
                return this.getPlaylist(id);
            }

            case "album": {
                return this.getAlbum(id);
            }

            default: break;
        }

        return undefined;
    }

    public async getAlbum(id: string): Promise<{ track: SpotifyTrack }[]> {
        const albumResponse = await this.client.request
            .get(`${this.baseURI}/albums/${id}`, {
                headers: {
                    Authorization: this.token
                }
            })
            .json<SpotifyAlbum>();
        let next = albumResponse.tracks.next;
        while ((next?.length ?? 0) > 0) {
            const nextPlaylistResponse = await this.client.request
                .get(next as unknown as string, {
                    headers: {
                        Authorization: this.token
                    }
                })
                .json<SpotifyAlbum["tracks"]>();
            next = nextPlaylistResponse.next;
            albumResponse.tracks.items.push(...nextPlaylistResponse.items);
        }
        return albumResponse.tracks.items.filter(Boolean).map(track => ({ track }));
    }

    public async getPlaylist(id: string): Promise<{ track: SpotifyTrack }[]> {
        const playlistResponse = await this.client.request
            .get(`${this.baseURI}/playlists/${id}`, {
                headers: {
                    Authorization: this.token
                }
            })
            .json<SpotifyPlaylist>();
        let next = playlistResponse.tracks.next;
        while ((next?.length ?? 0) > 0) {
            const nextPlaylistResponse = await this.client.request
                .get(next as unknown as string, {
                    headers: {
                        Authorization: this.token
                    }
                })
                .json<SpotifyPlaylist["tracks"]>();
            next = nextPlaylistResponse.next;
            playlistResponse.tracks.items.push(...nextPlaylistResponse.items);
        }

        return playlistResponse.tracks.items.filter(spotifyTrack => spotifyTrack.track);
    }

    public async getTrack(id: string): Promise<SpotifyTrack> {
        return this.client.request
            .get(`${this.baseURI}/tracks/${id}`, {
                headers: {
                    Authorization: this.token
                }
            })
            .json<SpotifyTrack>();
    }
}
