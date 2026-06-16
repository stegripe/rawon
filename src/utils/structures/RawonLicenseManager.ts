import { type Guild } from "discord.js";
import { type Rawon } from "../../structures/Rawon.js";
import { type PlaylistMetadata, type SearchTrackResult, type Song } from "../../typings/index.js";
import { i18n__mf } from "../functions/i18n.js";

type LicenseState = {
    usable: boolean;
    reason: string;
    reasonKey: LicenseReasonKey;
    reasonValues: Record<string, string>;
    retryable: boolean;
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

    public constructor(private readonly client: Rawon) {}

    public start(): void {
        this.refreshLocalState();
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
        return this.state.usable;
    }

    public async searchMusic(query: string): Promise<SearchTrackResult> {
        const response = await this.postProtected<RawonSearchResponse>(
            "/api/v1/rawon/music/search",
            {
                query,
                source: "youtube",
            },
        );

        if (!response.success) {
            throw new Error(response.error ?? response.message ?? "Licensed search failed.");
        }

        return {
            type: response.type,
            items: response.items ?? [],
            playlist: this.mapPlaylistMetadata(response.playlist),
        };
    }

    public async resolveMusic(url: string): Promise<SearchTrackResult> {
        const response = await this.postProtected<RawonResolveResponse>(
            "/api/v1/rawon/music/resolve",
            { url },
        );

        const items = response.items ?? (response.song ? [response.song] : []);
        if (!response.success || items.length === 0) {
            throw new Error(response.error ?? response.message ?? "Licensed resolve failed.");
        }

        return {
            type: "results",
            items,
            playlist: this.mapPlaylistMetadata(response.playlist),
        };
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

    private async postProtected<T>(path: string, json: Record<string, unknown>): Promise<T> {
        this.refreshLocalState();
        if (!this.state.usable) {
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
