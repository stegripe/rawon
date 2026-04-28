import { Buffer } from "node:buffer";
import { setTimeout } from "node:timers";
import { clientId, clientSecret } from "../../config/env.js";
import { type Rawon } from "../../structures/Rawon.js";
import {
    type ArtistsEntity,
    type PlaylistMetadata,
    type SpotifyAlbum,
    type SpotifyArtist,
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

    private isSpotifyEntityType(
        type: string | undefined,
    ): type is "album" | "artist" | "playlist" | "track" {
        return type === "track" || type === "playlist" || type === "album" || type === "artist";
    }

    private asRecord(value: unknown): Record<string, unknown> | undefined {
        if (typeof value !== "object" || value === null) {
            return undefined;
        }
        return value as Record<string, unknown>;
    }

    private asArray(value: unknown): unknown[] {
        return Array.isArray(value) ? value : [];
    }

    private asString(value: unknown): string | undefined {
        if (typeof value !== "string") {
            return undefined;
        }
        return value.length > 0 ? value : undefined;
    }

    private asNumber(value: unknown): number | undefined {
        if (typeof value !== "number" || Number.isNaN(value)) {
            return undefined;
        }
        return value;
    }

    private toOpenUrl(type: "album" | "artist" | "playlist" | "track", id: string): string {
        return `https://open.spotify.com/${type}/${id}`;
    }

    private extractIdFromUri(
        uri: string | undefined,
        expectedType: "album" | "artist" | "playlist" | "track",
    ): string | undefined {
        if ((uri?.length ?? 0) === 0) {
            return undefined;
        }

        const rawUri = uri ?? "";
        const prefix = `spotify:${expectedType}:`;
        if (rawUri.startsWith(prefix)) {
            const id = rawUri.slice(prefix.length).split(/[?#]/u)[0];
            return id.length > 0 ? id : undefined;
        }

        const [, type, id] = this.spotifyRegex.exec(rawUri) ?? [];
        if (type === expectedType && (id?.length ?? 0) > 0) {
            return id;
        }

        return undefined;
    }

    private toOpenUrlFromUri(
        uri: string | undefined,
        fallbackType: "album" | "artist" | "playlist" | "track",
        fallbackId: string,
    ): string {
        const parsedId = this.extractIdFromUri(uri, fallbackType) ?? fallbackId;
        return this.toOpenUrl(fallbackType, parsedId);
    }

    private createArtistEntity(name: string, uri: string | undefined): ArtistsEntity {
        const normalizedName = name.trim().length > 0 ? name : "Unknown Artist";
        const parsedId = this.extractIdFromUri(uri, "artist");
        const artistId =
            parsedId ?? `unknown-${normalizedName.toLowerCase().replace(/\s+/gu, "-")}`;
        const artistUri = uri ?? `spotify:artist:${artistId}`;

        return {
            external_urls: {
                spotify: this.toOpenUrlFromUri(artistUri, "artist", artistId),
            },
            href: `${this.baseURI}/artists/${artistId}`,
            name: normalizedName,
            type: "artist",
            uri: artistUri,
            id: artistId,
        };
    }

    private getFirstImageUrl(value: unknown, depth = 0): string | undefined {
        if (depth > 6 || value === undefined || value === null) {
            return undefined;
        }

        const direct = this.asString(this.asRecord(value)?.url);
        if (direct !== undefined) {
            return direct;
        }

        if (Array.isArray(value)) {
            for (const item of value) {
                const nested = this.getFirstImageUrl(item, depth + 1);
                if (nested !== undefined) {
                    return nested;
                }
            }
            return undefined;
        }

        const record = this.asRecord(value);
        if (record === undefined) {
            return undefined;
        }

        for (const key of ["sources", "items", "images", "coverArt", "data", "avatar"]) {
            const nested = this.getFirstImageUrl(record[key], depth + 1);
            if (nested !== undefined) {
                return nested;
            }
        }

        return undefined;
    }

    private extractArtists(trackRecord: Record<string, unknown>): ArtistsEntity[] {
        const artists: ArtistsEntity[] = [];
        const seen = new Set<string>();

        const addArtist = (rawArtist: unknown): void => {
            const artistRecord = this.asRecord(rawArtist);
            if (artistRecord === undefined) {
                return;
            }

            const profile = this.asRecord(artistRecord.profile);
            const name = this.asString(profile?.name) ?? this.asString(artistRecord.name);
            if (name === undefined) {
                return;
            }

            const uri = this.asString(artistRecord.uri);
            const artistId =
                this.asString(artistRecord.id) ??
                this.extractIdFromUri(uri, "artist") ??
                `unknown-${artists.length + 1}`;

            const dedupeKey = `${artistId}:${name}`.toLowerCase();
            if (seen.has(dedupeKey)) {
                return;
            }

            seen.add(dedupeKey);
            artists.push(this.createArtistEntity(name, uri));
        };

        const artistsRecord = this.asRecord(trackRecord.artists);
        for (const artist of this.asArray(artistsRecord?.items)) {
            addArtist(artist);
        }

        const firstArtist = this.asRecord(trackRecord.firstArtist);
        for (const artist of this.asArray(firstArtist?.items)) {
            addArtist(artist);
        }

        const otherArtists = this.asRecord(trackRecord.otherArtists);
        for (const artist of this.asArray(otherArtists?.items)) {
            addArtist(artist);
        }

        const albumArtists = this.asRecord(this.asRecord(trackRecord.albumOfTrack)?.artists);
        for (const artist of this.asArray(albumArtists?.items)) {
            addArtist(artist);
        }

        return artists;
    }

    private extractDurationMs(trackRecord: Record<string, unknown>): number {
        const durationObj = this.asRecord(trackRecord.duration);
        const totalMilliseconds = this.asNumber(durationObj?.totalMilliseconds);
        if (totalMilliseconds !== undefined) {
            return totalMilliseconds;
        }

        const durationMs = this.asNumber(trackRecord.duration_ms);
        if (durationMs !== undefined) {
            return durationMs;
        }

        const durationRaw = this.asNumber(trackRecord.duration);
        if (durationRaw !== undefined) {
            return durationRaw;
        }

        return 0;
    }

    private mapWebTrack(rawTrack: unknown): SpotifyTrack | undefined {
        const trackRecord = this.asRecord(rawTrack);
        if (trackRecord === undefined) {
            return undefined;
        }

        const uri = this.asString(trackRecord.uri);
        const id = this.asString(trackRecord.id) ?? this.extractIdFromUri(uri, "track");
        if (id === undefined) {
            return undefined;
        }

        const name = this.asString(trackRecord.name) ?? "Unknown Track";
        const artists = this.extractArtists(trackRecord);

        const externalIds =
            this.asRecord(trackRecord.external_ids) ?? this.asRecord(trackRecord.externalIds);
        const isrc = this.asString(externalIds?.isrc);

        const track: SpotifyTrack = {
            artists:
                artists.length > 0
                    ? artists
                    : [this.createArtistEntity("Unknown Artist", undefined)],
            duration_ms: this.extractDurationMs(trackRecord),
            external_urls: {
                spotify: this.toOpenUrlFromUri(uri, "track", id),
            },
            name,
            id,
        };

        if (isrc !== undefined) {
            track.external_ids = {
                isrc,
            };
        }

        return track;
    }

    private extractWebTrack(rawItem: unknown): SpotifyTrack | undefined {
        const itemRecord = this.asRecord(rawItem);
        if (itemRecord === undefined) {
            return undefined;
        }

        const item = this.asRecord(itemRecord.item);
        const itemV2 = this.asRecord(itemRecord.itemV2);
        const candidates: unknown[] = [rawItem, itemRecord.track, item?.track, item, itemV2?.data];

        for (const candidate of candidates) {
            const track = this.mapWebTrack(candidate);
            if (track !== undefined) {
                return track;
            }
        }

        return undefined;
    }

    private extractWebTrackList(rawItems: unknown): { track: SpotifyTrack }[] {
        return this.asArray(rawItems)
            .map((item) => this.extractWebTrack(item))
            .filter((track): track is SpotifyTrack => track !== undefined)
            .map((track) => ({ track }));
    }

    private async fetchWebEntity(
        type: "album" | "artist" | "playlist" | "track",
        id: string,
    ): Promise<Record<string, unknown> | undefined> {
        const pageUrl = this.toOpenUrl(type, id);
        const html = await this.client.request
            .get(pageUrl, {
                headers: {
                    Accept: "text/html",
                    "User-Agent": "Mozilla/5.0",
                },
            })
            .text();

        const initialStateMatch = html.match(
            /<script id="initialState" type="text\/plain">([\s\S]*?)<\/script>/u,
        );
        if (initialStateMatch === null) {
            return undefined;
        }

        const initialStateRaw = Buffer.from(initialStateMatch[1], "base64").toString("utf8");
        const initialState = JSON.parse(initialStateRaw) as Record<string, unknown>;
        const entities = this.asRecord(this.asRecord(initialState.entities)?.items);
        if (entities === undefined) {
            return undefined;
        }

        const entityKey = `spotify:${type}:${id}`;
        const exactEntity = this.asRecord(entities[entityKey]);
        if (exactEntity !== undefined) {
            return exactEntity;
        }

        for (const value of Object.values(entities)) {
            const entity = this.asRecord(value);
            if (entity === undefined) {
                continue;
            }

            const uri = this.asString(entity.uri);
            const entityId = this.asString(entity.id);
            if (uri === entityKey || entityId === id) {
                return entity;
            }
        }

        return undefined;
    }

    private async resolveTracksWithMetadataFromWeb(
        type: "album" | "artist" | "playlist" | "track",
        id: string,
    ): Promise<SpotifyResolveResult | SpotifyTrack | undefined> {
        try {
            const entity = await this.fetchWebEntity(type, id);
            if (entity === undefined) {
                return undefined;
            }

            switch (type) {
                case "track":
                    return this.mapWebTrack(entity);

                case "playlist": {
                    const content = this.asRecord(entity.content);
                    const owner = this.asRecord(this.asRecord(entity.ownerV2)?.data);

                    const metadata: PlaylistMetadata = {
                        title: this.asString(entity.name) ?? "Spotify Playlist",
                        url: this.toOpenUrlFromUri(this.asString(entity.uri), "playlist", id),
                        thumbnail: this.getFirstImageUrl(entity.images),
                        author: this.asString(owner?.name),
                    };

                    return {
                        tracks: this.extractWebTrackList(content?.items),
                        metadata,
                    };
                }

                case "album": {
                    const tracksV2 = this.asRecord(entity.tracksV2);
                    const artistNames = this.asArray(this.asRecord(entity.artists)?.items)
                        .map((artist) => {
                            const artistRecord = this.asRecord(artist);
                            return this.asString(this.asRecord(artistRecord?.profile)?.name);
                        })
                        .filter((name): name is string => name !== undefined);

                    const metadata: PlaylistMetadata = {
                        title: this.asString(entity.name) ?? "Spotify Album",
                        url: this.toOpenUrlFromUri(this.asString(entity.uri), "album", id),
                        thumbnail: this.getFirstImageUrl(entity.coverArt),
                        author: artistNames.length > 0 ? artistNames.join(", ") : undefined,
                    };

                    return {
                        tracks: this.extractWebTrackList(tracksV2?.items),
                        metadata,
                    };
                }

                case "artist": {
                    const profile = this.asRecord(entity.profile);
                    const discography = this.asRecord(entity.discography);
                    const topTracks = this.asRecord(discography?.topTracks);
                    const artistName = this.asString(profile?.name) ?? "Unknown Artist";

                    const metadata: PlaylistMetadata = {
                        title: `${artistName} — Top Tracks`,
                        url: this.toOpenUrlFromUri(this.asString(entity.uri), "artist", id),
                        thumbnail: this.getFirstImageUrl(entity.headerImage),
                        author: artistName,
                    };

                    return {
                        tracks: this.extractWebTrackList(topTracks?.items),
                        metadata,
                    };
                }

                default:
                    return undefined;
            }
        } catch (error) {
            this.client.logger.warn(`[SpotifyUtil] Web fallback failed for ${type}:${id}.`, error);
            return undefined;
        }
    }

    private isResolveResult(
        value: SpotifyResolveResult | SpotifyTrack | undefined,
    ): value is SpotifyResolveResult {
        return typeof value === "object" && value !== null && "tracks" in value;
    }

    private isTrack(value: SpotifyResolveResult | SpotifyTrack | undefined): value is SpotifyTrack {
        return typeof value === "object" && value !== null && "artists" in value;
    }

    private getStatusCode(error: unknown): number | undefined {
        return this.asNumber(this.asRecord(this.asRecord(error)?.response)?.statusCode);
    }

    private logApiFallback(
        mode: "resolve" | "resolveWithMetadata",
        type: "album" | "artist" | "playlist" | "track",
        id: string,
        error: unknown,
    ): void {
        const statusCode = this.getStatusCode(error);
        const modeText = mode === "resolve" ? "resolve" : "resolve with metadata";

        if (statusCode === 401 || statusCode === 403) {
            this.client.logger.warn(
                `[SpotifyUtil] API ${modeText} failed for ${type}:${id} (status ${statusCode}). Using web fallback.`,
            );
            return;
        }

        this.client.logger.warn(
            `[SpotifyUtil] API ${modeText} failed for ${type}:${id}. Using web fallback.`,
            error,
        );
    }

    public async resolveTracks(
        url: string,
    ): Promise<{ track: SpotifyTrack }[] | SpotifyTrack | undefined> {
        const [, type, id] = this.spotifyRegex.exec(url) ?? [];
        if (!this.isSpotifyEntityType(type) || id === undefined) {
            return undefined;
        }

        try {
            switch (type) {
                case "track":
                    return await this.getTrack(id);
                case "playlist":
                    return await this.getPlaylist(id);
                case "album":
                    return await this.getAlbum(id);
                case "artist":
                    return await this.getArtistTopTracks(id);
                default:
                    return undefined;
            }
        } catch (error) {
            this.logApiFallback("resolve", type, id, error);

            const fallbackResult = await this.resolveTracksWithMetadataFromWeb(type, id);
            if (fallbackResult === undefined) {
                throw error;
            }

            if (type === "track") {
                return this.isTrack(fallbackResult) ? fallbackResult : undefined;
            }

            return this.isResolveResult(fallbackResult) ? fallbackResult.tracks : undefined;
        }
    }

    public async resolveTracksWithMetadata(
        url: string,
    ): Promise<SpotifyResolveResult | SpotifyTrack | undefined> {
        const [, type, id] = this.spotifyRegex.exec(url) ?? [];
        if (!this.isSpotifyEntityType(type) || id === undefined) {
            return undefined;
        }

        try {
            switch (type) {
                case "track":
                    return await this.getTrack(id);
                case "playlist":
                    return await this.getPlaylistWithMetadata(id);
                case "album":
                    return await this.getAlbumWithMetadata(id);
                case "artist":
                    return await this.getArtistTopTracksWithMetadata(id);
                default:
                    return undefined;
            }
        } catch (error) {
            this.logApiFallback("resolveWithMetadata", type, id, error);

            const fallbackResult = await this.resolveTracksWithMetadataFromWeb(type, id);
            if (fallbackResult !== undefined) {
                return fallbackResult;
            }

            throw error;
        }
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
