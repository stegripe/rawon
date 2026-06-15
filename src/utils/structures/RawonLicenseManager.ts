import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { clearInterval, setInterval } from "node:timers";
import { type Guild } from "discord.js";
import { type Rawon } from "../../structures/Rawon.js";
import { type PlaylistMetadata, type SearchTrackResult, type Song } from "../../typings/index.js";
import { i18n__mf } from "../functions/i18n.js";

const SESSION_REFRESH_INTERVAL_MS = 15 * 60 * 1000;
const SESSION_REFRESH_EARLY_MS = 60 * 1000;
const GRACE_WINDOW_MS = 24 * 60 * 60 * 1000;

type LicenseState = {
    usable: boolean;
    reason: string;
    reasonKey: LicenseReasonKey;
    reasonValues: Record<string, string>;
    retryable: boolean;
    sessionToken: string | null;
    sessionExpiresAt: number;
    lastValidatedAt: number;
};

type SessionResponse = {
    success: boolean;
    session_token?: string;
    expires_at?: string;
    owner_discord_id?: string;
    message?: string;
    error?: string;
    error_code?: string;
    retryable?: boolean;
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

type CachedLicense = {
    botId: string;
    lastValidatedAt: number;
};

type LicenseReasonKey =
    | "notValidated"
    | "botNotReady"
    | "missingKey"
    | "validationFailed"
    | "apiGrace"
    | "apiUnavailableNoSession"
    | "botNotAllowed"
    | "invalidLicense"
    | "revoked"
    | "sessionLimit";

export class RawonLicenseManager {
    private state: LicenseState = {
        usable: false,
        reason: "License has not been validated yet.",
        reasonKey: "notValidated",
        reasonValues: {},
        retryable: true,
        sessionToken: null,
        sessionExpiresAt: 0,
        lastValidatedAt: 0,
    };
    private refreshInterval: ReturnType<typeof setInterval> | null = null;
    private validationPromise: Promise<void> | null = null;

    public constructor(private readonly client: Rawon) {}

    public start(): void {
        void this.refresh();
        this.refreshInterval = setInterval(() => {
            void this.refresh();
        }, SESSION_REFRESH_INTERVAL_MS);
    }

    public stop(): void {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    }

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
        if (this.isCurrentSessionUsable()) {
            return true;
        }
        await this.refresh();
        return this.state.usable;
    }

    public async searchMusic(query: string): Promise<SearchTrackResult> {
        const sessionToken = await this.requireSessionToken();
        const response = await this.postProtected<RawonSearchResponse>(
            "/api/v1/rawon/music/search",
            sessionToken,
            { query, source: "youtube" },
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
        const sessionToken = await this.requireSessionToken();
        const response = await this.postProtected<RawonResolveResponse>(
            "/api/v1/rawon/music/resolve",
            sessionToken,
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

    private async requireSessionToken(): Promise<string> {
        if (!(await this.ensureUsable()) || !this.state.sessionToken) {
            throw new Error(this.state.reason);
        }
        return this.state.sessionToken;
    }

    private async refresh(): Promise<void> {
        if (this.validationPromise) {
            return this.validationPromise;
        }

        this.validationPromise = this.refreshInner().finally(() => {
            this.validationPromise = null;
        });
        return this.validationPromise;
    }

    private async refreshInner(): Promise<void> {
        const botId = this.client.user?.id;
        if (!botId) {
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

        if (this.isCurrentSessionUsable()) {
            return;
        }

        try {
            const response = await this.client.request
                .post(`${this.client.config.stegripeApiUrl}/api/v1/rawon/session`, {
                    json: {
                        license_key: this.client.config.rawonLicenseKey,
                        bot_id: botId,
                        rawon_version: process.env.npm_package_version ?? "",
                    },
                    timeout: { request: 15_000 },
                })
                .json<SessionResponse>();

            if (!response.success || !response.session_token || !response.expires_at) {
                this.setBlocked(
                    response.message ?? response.error ?? "License validation failed.",
                    response.retryable === true,
                    "validationFailed",
                );
                return;
            }

            const expiresAt = Date.parse(response.expires_at);
            const now = Date.now();
            this.state = {
                usable: true,
                reason: "License is valid.",
                reasonKey: "notValidated",
                reasonValues: {},
                retryable: false,
                sessionToken: response.session_token,
                sessionExpiresAt: Number.isFinite(expiresAt) ? expiresAt : now,
                lastValidatedAt: now,
            };
            this.writeCache({ botId, lastValidatedAt: now });
            this.client.logger.info(`[License] Rawon license validated for bot ${botId}`);
        } catch (error) {
            const apiError = this.getApiErrorDetail(error);
            if (apiError.statusCode && !apiError.retryable && apiError.statusCode < 500) {
                this.setBlocked(
                    apiError.message,
                    false,
                    this.reasonKeyFromApiError(apiError.errorCode),
                );
                return;
            }

            if (this.canUseGrace(botId) && this.state.sessionToken) {
                this.state = {
                    ...this.state,
                    usable: true,
                    reason: "License validation is temporarily unreachable; using cached grace window.",
                    reasonKey: "apiGrace",
                    reasonValues: {},
                    retryable: true,
                    sessionToken: this.state.sessionToken,
                    sessionExpiresAt: Date.now() + SESSION_REFRESH_INTERVAL_MS,
                };
                this.client.logger.warn(
                    `[License] API unavailable, using cached grace window: ${apiError.message}`,
                );
                return;
            }

            this.setBlocked(
                `License validation is temporarily unreachable and no active session exists: ${apiError.message}`,
                true,
                "apiUnavailableNoSession",
                { error: this.formatSentence(apiError.message) },
            );
        }
    }

    private async postProtected<T>(
        path: string,
        sessionToken: string,
        json: Record<string, unknown>,
    ): Promise<T> {
        try {
            return await this.client.request
                .post(`${this.client.config.stegripeApiUrl}${path}`, {
                    headers: {
                        Authorization: `Bearer ${sessionToken}`,
                    },
                    json,
                })
                .json<T>();
        } catch (error) {
            throw new Error(this.formatApiError(error, "Licensed request failed."));
        }
    }

    private formatApiError(error: unknown, fallback: string): string {
        return this.getApiErrorDetail(error, fallback).message;
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

    private isCurrentSessionUsable(): boolean {
        return (
            this.state.usable &&
            this.state.sessionToken !== null &&
            Date.now() < this.state.sessionExpiresAt - SESSION_REFRESH_EARLY_MS
        );
    }

    private canUseGrace(botId: string): boolean {
        const cached = this.readCache();
        if (!cached || cached.botId !== botId) {
            return false;
        }
        return Date.now() - cached.lastValidatedAt <= GRACE_WINDOW_MS;
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
            sessionToken: null,
            sessionExpiresAt: 0,
            lastValidatedAt: this.state.lastValidatedAt,
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
            case "session_limit":
                return "sessionLimit";
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

    private cachePath(): string {
        return path.resolve(process.cwd(), "cache", "license.json");
    }

    private readCache(): CachedLicense | null {
        const cachePath = this.cachePath();
        if (!existsSync(cachePath)) {
            return null;
        }
        try {
            return JSON.parse(readFileSync(cachePath, "utf8")) as CachedLicense;
        } catch {
            return null;
        }
    }

    private writeCache(cache: CachedLicense): void {
        const cachePath = this.cachePath();
        mkdirSync(path.dirname(cachePath), { recursive: true });
        writeFileSync(cachePath, JSON.stringify(cache), "utf8");
    }
}
