/* eslint-disable no-await-in-loop */
import { setTimeout } from "node:timers";
import type { Rawon } from "../../structures/Rawon.js";
import type { SpotifyAccessTokenAPIResult, SpotifyAlbum, SpotifyPlaylist, SpotifyTrack } from "../../typings/index.js";

export class SpotifyUtil {
    public spotifyRegex = /(?:https:\/\/open\.spotify\.com\/|spotify:)(?:.+)?(?<type>track|playlist|album)[/:](?<id>[\dA-Za-z]+)/u;
    public baseURI = "https://api.spotify.com/v1";
    private token!: string;

    public constructor(public client: Rawon) { }

    public async fetchTokenWithRetries(retries: number = 3): Promise<number> {

        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                const { accessToken, accessTokenExpirationTimestampMs } = await this.client.request
                    .get("https://open.spotify.com/get_access_token", {
                        headers: {
                            "User-Agent":
                                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 Edg/91.0.864.59"
                        }
                    })
                    .json<SpotifyAccessTokenAPIResult>();
                if (accessToken === null || accessToken === undefined || accessToken.length === 0) {
                    throw new Error("Could not fetch Spotify token.");
                }
                this.token = `Bearer ${accessToken}`;
                return accessTokenExpirationTimestampMs - Date.now() - 300_000; // 5 minutos en milisegundos
            } 
            
            catch (error) {
                if (attempt === retries) {
                    this.client.logger.error(`[SpotifyUtil] Failed to fetch Spotify token after ${retries} attempts: `, error);
                    throw error;
                }
                this.client.logger.warn(`[SpotifyUtil] Attempt ${attempt} failed. Retrying...`);
            }
        }
        throw new Error("Failed to fetch Spotify token after retries.");
    }

    public async renew(): Promise<void> {
        try {
            const renewInterval = await this.fetchTokenWithRetries();
            this.client.logger.info(`[SpotifyUtil] Token fetched successfully.`);
            this.client.logger.info(`[SpotifyUtil] Renewing token in ${(renewInterval / 1_000 / 60).toFixed(2)} minutes.`);
            setTimeout(async () => this.renew(), renewInterval);
        }   
        catch (error) {
            this.client.logger.error("[SpotifyUtil] Failed to renew Spotify token: ", error);
        }
    }    

    public resolveTracks(url: string): Promise<{ track: SpotifyTrack }[]> | Promise<SpotifyTrack> | undefined {

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
                    Authorization: this.token
                }
            })
            .json<SpotifyAlbum>();
    
        let next = albumResponse.tracks.next;

        while (next !== null && next !== undefined) {
            const nextPlaylistResponse = await this.client.request
                .get(next, {
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
        
        const allTracks = playlistResponse.tracks.items.map((item, index) => ({
            ...item,
            originalIndex: index,
        }));
    
        let next = playlistResponse.tracks.next;

        while (next !== null && next !== undefined) {
            const nextPlaylistResponse = await this.client.request
                .get(next, {
                    headers: {
                        Authorization: this.token
                    }
                })
                .json<SpotifyPlaylist["tracks"]>();
    
            for (const [index, item] of nextPlaylistResponse.items.entries()) {
                allTracks.push({
                    ...item,
                    originalIndex: allTracks.length + index,
                });
            }     
            next = nextPlaylistResponse.next;
        }
        allTracks.sort((a, b) => a.originalIndex - b.originalIndex); 
        return allTracks.map(({ track }) => ({ track }));
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
