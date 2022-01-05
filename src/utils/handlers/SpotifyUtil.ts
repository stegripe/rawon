import { Disc } from "../../structures/Disc";
import { ISpotifyAccessTokenAPIResult, SpotifyPlaylist, SpotifyTrack } from "../../typings";

export class SpotifyUtil {
    public spotifyRegex = /(?:https:\/\/open\.spotify\.com\/|spotify:)(?:.+)?(track|playlist|album)[\/:]([A-Za-z0-9]+)/;
    public baseURI = "https://api.spotify.com/v1";
    private token!: string;

    public constructor(public client: Disc) {}

    public async fetchToken(): Promise<number> {
        const { accessToken, accessTokenExpirationTimestampMs } = await this.client.request.get("https://open.spotify.com/get_access_token?reason=transport&productType=embed", { headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 Edg/91.0.864.59" } }).json<ISpotifyAccessTokenAPIResult>();
        if (!accessToken) throw new Error("Could not fetch self spotify token.");
        this.token = `Bearer ${accessToken}`;
        return new Date(accessTokenExpirationTimestampMs).getMilliseconds() * 1000;
    }

    public async renew(): Promise<void> {
        const lastRenew = await this.fetchToken();
        setTimeout(() => this.renew(), lastRenew);
    }

    public resolveTracks(url: string): Promise<SpotifyTrack> | Promise<{ track: SpotifyTrack }[]> | void {
        const [, type, id] = url.match(this.spotifyRegex) ?? [];
        switch (type) {
            case "track": {
                return this.getTrack(id);
            }

            case "playlist": {
                return this.getPlaylist(id);
            }
        }
    }

    public async getPlaylist(id: string): Promise<{ track: SpotifyTrack }[]> {
        const playlistResponse = await this.client.request.get(`${this.baseURI}/playlists/${id}`, { headers: { Authorization: this.token } }).json<SpotifyPlaylist>();
        let next = playlistResponse.tracks.next;
        while (next) {
            const nextPlaylistResponse = await this.client.request.get(next, { headers: { Authorization: this.token } }).json<SpotifyPlaylist>();
            next = nextPlaylistResponse.tracks.next;
            playlistResponse.tracks.items.push(...nextPlaylistResponse.tracks.items);
        }
        return playlistResponse.tracks.items;
    }

    public getTrack(id: string): Promise<SpotifyTrack> {
        return this.client.request.get(`${this.baseURI}/tracks/${id}`, { headers: { Authorization: this.token } }).json<SpotifyTrack>();
    }
}
