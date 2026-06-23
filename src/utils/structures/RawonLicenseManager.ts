import { readFileSync } from "node:fs";
import { type Guild } from "discord.js";
import { clientId, clientSecret } from "../../config/env.js";
import { type Rawon } from "../../structures/Rawon.js";
import { type PlaylistMetadata, type SearchTrackResult, type Song } from "../../typings/index.js";
import { normalizeSearchTrackThumbnails } from "../functions/getMaxResThumbnail.js";
import { i18n__mf } from "../functions/i18n.js";

type LicenseState = {
    usable: boolean;
    reason: string;
    reasonKey: LicenseReasonKey;
    reasonValues: Record<string, string>;
    retryable: boolean;
};

type RawonCredentialsPayload = {
    spotify_client_id?: string;
    spotify_client_secret?: string;
    youtube_cookies?: string;
};

type RawonSearchResponse = {
    success: boolean;
    type?: "results" | "selection";
    items?: Song[];
    playlist?: RawonPlaylistMetadataResponse;
    message?: string;
    error?: string;
};

type RawonResolveResponse = {
    success: boolean;
    song?: Song;
    items?: Song[];
    playlist?: RawonPlaylistMetadataResponse;
    message?: string;
    error?: string;
};

type RawonAutoplayResponse = {
    success: boolean;
    song?: Song;
    message?: string;
    error?: string;
};

type RawonValidateResponse = {
    success: boolean;
    message?: string;
    error?: string;
};

type RawonPlaylistMetadataResponse = {
    title: string;
    url: string;
    thumbnail?: string;
    author?: string;
    skipped_count?: number;
    skipped_reason?: PlaylistMetadata["skippedReason"];
};

type ApiErrorPayload = {
    error?: string;
    message?: string;
    error_code?: string;
    retryable?: boolean;
};

type ApiErrorDetail = {
    message: string;
    statusCode: number | null;
    errorCode: string | null;
    retryable: boolean;
};

type LicenseReasonKey =
    | "notValidated"
    | "botNotReady"
    | "missingKey"
    | "validationFailed"
    | "botNotAllowed"
    | "invalidLicense"
    | "revoked";

export class RawonLicenseManager {
    private state: LicenseState = {
        usable: false,
        reason: "License has not been checked yet.",
        reasonKey: "notValidated",
        reasonValues: {},
        retryable: true,
    };

    private validationPromise: Promise<boolean> | null = null;

    public constructor(private readonly client: Rawon) {}

    public start(): void {
        void this.ensureUsable();
    }

    public stop(): void {}

    public get usable(): boolean {
        return this.state.usable;
    }

    public get blockMessage(): string {
        return this.blockMessageFor(null);
    }

    public blockMessageFor(guild: Guild | string | null | undefined): string {
        const botId = this.client.user?.id ?? "unknown";
        const __mf = i18n__mf(this.client, guild);
        const reason = __mf(`utils.license.reasons.${this.state.reasonKey}`, {
            reason: this.formatSentence(this.state.reason),
            ...this.state.reasonValues,
        });

        return __mf("utils.license.blockMessage", { botId, reason });
    }

    public async ensureUsable(): Promise<boolean> {
        this.refreshLocalState();
        if (!this.state.usable) {
            return false;
        }

        if (this.validationPromise) {
            return this.validationPromise;
        }

        this.validationPromise = this.validateRemoteLicense()
            .catch(() => false)
            .finally(() => {
                this.validationPromise = null;
            });

        return this.validationPromise;
    }

    public async searchMusic(
        query: string,
        source: "soundcloud" | "youtube" = "youtube",
    ): Promise<SearchTrackResult> {
        const response = await this.postProtected<RawonSearchResponse>(
            "/api/v1/rawon/music/search",
            {
                query,
                source,
                credentials: this.buildCredentials(),
            },
            60_000,
        );

        if (!response.success) {
            throw new Error(response.error ?? response.message ?? "Licensed search failed.");
        }

        return normalizeSearchTrackThumbnails({
            type: response.type,
            items: response.items ?? [],
            playlist: this.mapPlaylistMetadata(response.playlist),
        });
    }

    public async resolveMusic(url: string): Promise<SearchTrackResult> {
        const response = await this.postProtected<RawonResolveResponse>(
            "/api/v1/rawon/music/resolve",
            {
                url,
                credentials: this.buildCredentials(),
            },
            60_000,
        );

        const items = response.items ?? (response.song ? [response.song] : []);
        if (!response.success || items.length === 0) {
            throw new Error(response.error ?? response.message ?? "Licensed resolve failed.");
        }

        return normalizeSearchTrackThumbnails({
            type: "results",
            items,
            playlist: this.mapPlaylistMetadata(response.playlist),
        });
    }

    public async autoplayMusic(
        currentSong: Song,
        history: Song[],
        source?: string,
    ): Promise<Song | undefined> {
        const response = await this.postProtected<RawonAutoplayResponse>(
            "/api/v1/rawon/music/autoplay",
            {
                current_song: currentSong,
                history,
                source,
                credentials: this.buildCredentials(),
            },
            60_000,
        );

        if (!response.success || !response.song) {
            return undefined;
        }

        return normalizeSearchTrackThumbnails({
            type: "results",
            items: [response.song],
        }).items[0];
    }

    private async validateRemoteLicense(): Promise<boolean> {
        this.refreshLocalState();
        if (!this.state.usable) {
            return false;
        }

        try {
            const response = await this.client.request
                .get(`${this.client.config.stegripeApiUrl}/api/v1/rawon/music/validate`, {
                    headers: {
                        Authorization: `Bearer ${this.client.config.rawonLicenseKey}`,
                        "X-Rawon-Bot-ID": this.client.user?.id ?? "",
                    },
                })
                .json<RawonValidateResponse>();

            if (!response.success) {
                this.setBlocked(
                    response.error ?? response.message ?? "License validation failed.",
                    false,
                    "validationFailed",
                );
                return false;
            }

            this.state = {
                usable: true,
                reason: "License validated.",
                reasonKey: "notValidated",
                reasonValues: {},
                retryable: false,
            };
            return true;
        } catch (error) {
            const apiError = this.getApiErrorDetail(error, "License validation failed.");
            if (apiError.statusCode && apiError.statusCode < 500) {
                this.setBlocked(
                    apiError.message,
                    apiError.retryable,
                    this.reasonKeyFromApiError(apiError.errorCode),
                );
                return false;
            }

            this.client.logger.warn(
                `[License] Remote validation unavailable: ${apiError.message}. Allowing configured key until next protected request.`,
            );
            return true;
        }
    }

    private buildCredentials(): RawonCredentialsPayload | undefined {
        const credentials: RawonCredentialsPayload = {};

        if (clientId && clientSecret) {
            credentials.spotify_client_id = clientId;
            credentials.spotify_client_secret = clientSecret;
        }

        const cookiePath = this.client.cookies.getCurrentCookiePath();
        if (cookiePath) {
            try {
                const content = readFileSync(cookiePath, "utf8").trim();
                if (content.length > 0) {
                    credentials.youtube_cookies = content;
                }
            } catch (error) {
                this.client.logger.debug(
                    `[License] Failed reading forwarded YouTube cookies: ${(error as Error).message}`,
                );
            }
        }

        if (
            credentials.spotify_client_id === undefined &&
            credentials.spotify_client_secret === undefined &&
            credentials.youtube_cookies === undefined
        ) {
            return undefined;
        }

        return credentials;
    }

    private mapPlaylistMetadata(
        playlist: RawonPlaylistMetadataResponse | undefined,
    ): PlaylistMetadata | undefined {
        if (playlist === undefined) {
            return undefined;
        }
        return {
            title: playlist.title,
            url: playlist.url,
            thumbnail: playlist.thumbnail,
            author: playlist.author,
            skippedCount: playlist.skipped_count,
            skippedReason: playlist.skipped_reason,
        };
    }

    private refreshLocalState(): void {
        if (!this.client.user?.id) {
            this.setBlocked("Bot ID is not ready yet.", true, "botNotReady");
            return;
        }

        if (!this.client.config.rawonLicenseKey) {
            this.setBlocked(
                "STEGRIPE_API_LICENSE_KEY is missing. Licensed features are locked.",
                false,
                "missingKey",
            );
            return;
        }

        this.state = {
            usable: true,
            reason: "License key is configured.",
            reasonKey: "notValidated",
            reasonValues: {},
            retryable: false,
        };
    }

    private async postProtected<T>(
        path: string,
        json: Record<string, unknown>,
        timeoutMs = 120_000,
    ): Promise<T> {
        const usable = await this.ensureUsable();
        if (!usable) {
            throw new Error(this.state.reason);
        }

        try {
            return await this.client.request
                .post(`${this.client.config.stegripeApiUrl}${path}`, {
                    headers: {
                        Authorization: `Bearer ${this.client.config.rawonLicenseKey}`,
                        "X-Rawon-Bot-ID": this.client.user?.id ?? "",
                    },
                    json,
                    timeout: { request: timeoutMs },
                })
                .json<T>();
        } catch (error) {
            const apiError = this.getApiErrorDetail(error, "Licensed request failed.");
            if (apiError.statusCode && apiError.statusCode < 500) {
                this.setBlocked(
                    apiError.message,
                    apiError.retryable,
                    this.reasonKeyFromApiError(apiError.errorCode),
                );
            }
            throw new Error(apiError.message);
        }
    }

    private getApiErrorDetail(
        error: unknown,
        fallback = "Licensed request failed.",
    ): ApiErrorDetail {
        const response = (error as { response?: { body?: unknown; statusCode?: number } }).response;
        const body = response?.body;
        const payload = this.parseApiErrorPayload(body);
        const message = payload?.error ?? payload?.message;
        if (message) {
            return {
                message,
                statusCode: response?.statusCode ?? null,
                errorCode: payload?.error_code ?? null,
                retryable: payload?.retryable === true,
            };
        }
        if (error instanceof Error && error.message) {
            return {
                message: error.message,
                statusCode: response?.statusCode ?? null,
                errorCode: payload?.error_code ?? null,
                retryable: false,
            };
        }
        if (response?.statusCode) {
            return {
                message: `${fallback} HTTP ${response.statusCode}.`,
                statusCode: response.statusCode,
                errorCode: payload?.error_code ?? null,
                retryable: response.statusCode >= 500,
            };
        }
        return {
            message: fallback,
            statusCode: null,
            errorCode: payload?.error_code ?? null,
            retryable: true,
        };
    }

    private parseApiErrorPayload(body: unknown): ApiErrorPayload | null {
        if (!body) {
            return null;
        }
        if (typeof body === "object") {
            return body as ApiErrorPayload;
        }
        if (typeof body !== "string") {
            return null;
        }
        try {
            return JSON.parse(body) as ApiErrorPayload;
        } catch {
            return null;
        }
    }

    private setBlocked(
        reason: string,
        retryable: boolean,
        reasonKey: LicenseReasonKey = "validationFailed",
        reasonValues: Record<string, string> = {},
    ): void {
        this.state = {
            usable: false,
            reason,
            reasonKey,
            reasonValues,
            retryable,
        };
        this.client.logger.warn(`[License] ${reason}`);
    }

    private reasonKeyFromApiError(errorCode: string | null): LicenseReasonKey {
        switch (errorCode) {
            case "bot_not_allowed":
                return "botNotAllowed";
            case "invalid_license":
                return "invalidLicense";
            case "license_revoked":
                return "revoked";
            case "missing_license":
                return "missingKey";
            default:
                return "validationFailed";
        }
    }

    private formatSentence(message: string): string {
        const trimmed = message.trim();
        if (!trimmed) {
            return trimmed;
        }
        return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
    }
}
