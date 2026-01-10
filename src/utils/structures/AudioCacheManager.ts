import { type Buffer } from "node:buffer";
import { createHash } from "node:crypto";
import {
    createReadStream,
    createWriteStream,
    existsSync,
    mkdirSync,
    type ReadStream,
    rmSync,
    statSync,
} from "node:fs";
import path from "node:path";
import process from "node:process";
import { PassThrough, type Readable } from "node:stream";
import { clearInterval, setInterval, setTimeout } from "node:timers";
import got from "got";
import { type Rawon } from "../../structures/Rawon.js";

const PRE_CACHE_AHEAD_COUNT = 3;
const MAX_CACHE_SIZE_MB = 500;
const MAX_CACHE_FILES = 50;
const PRE_CACHE_RETRY_COUNT = 2;
const QUEUE_PROCESSING_DELAY_MS = 50;
const MAX_PRE_CACHE_RETRIES = 3;

export class AudioCacheManager {
    public readonly cacheDir: string;
    private readonly cachedFiles = new Map<string, { path: string; lastAccess: number }>();
    private readonly inProgressFiles = new Set<string>();
    private readonly inProgressProcs = new Map<
        string,
        { proc?: any; stream?: Readable; writeStreamPath?: string }
    >();
    private readonly failedUrls = new Map<string, { count: number; lastAttempt: number }>();
    private readonly preCacheQueue: string[] = [];
    private isProcessingQueue = false;

    public constructor(public readonly client: Rawon) {
        this.cacheDir = path.resolve(process.cwd(), "cache", "audio");
        this.ensureCacheDir();
    }

    private async isDirectDownload(url: string): Promise<boolean> {
        try {
            const extRegex = /\.(mp4|m4a|webm|mp3|opus|wav|flac)(\?|$)/i;
            if (extRegex.test(url)) {
                return true;
            }

            const res = await got.head(url, {
                timeout: { request: 2_000 },
                throwHttpErrors: false,
            });
            const ct = (res.headers["content-type"] ?? "").toString().toLowerCase();
            if (ct.startsWith("audio/") || ct.startsWith("video/")) {
                return true;
            }

            const cd = (res.headers["content-disposition"] ?? "").toString().toLowerCase();
            if (cd.includes("attachment")) {
                return true;
            }
        } catch {
            // Ignore errors
        }
        return false;
    }

    private ensureCacheDir(): void {
        if (!existsSync(this.cacheDir)) {
            mkdirSync(this.cacheDir, { recursive: true });
            this.client.logger.info("[AudioCacheManager] Cache directory created.");
        }
    }

    public getCacheKey(url: string): string {
        return createHash("md5").update(url).digest("hex");
    }

    public getCachePath(url: string): string {
        const key = this.getCacheKey(url);
        return path.join(this.cacheDir, `${key}.opus`);
    }

    public isCached(url: string): boolean {
        const key = this.getCacheKey(url);
        const cachePath = this.getCachePath(url);

        if (this.inProgressFiles.has(key)) {
            return false;
        }

        if (this.cachedFiles.has(key) && existsSync(cachePath)) {
            return true;
        }

        return false;
    }

    public isInProgress(url: string): boolean {
        const key = this.getCacheKey(url);
        return this.inProgressFiles.has(key);
    }

    public getFromCache(url: string): ReadStream | null {
        if (!this.isCached(url)) {
            return null;
        }

        const cachePath = this.getCachePath(url);
        const key = this.getCacheKey(url);

        try {
            if (!existsSync(cachePath)) {
                this.client.logger.warn(
                    `[AudioCacheManager] Cached file missing for ${url.substring(0, 50)}..., removing from cache`,
                );
                this.cachedFiles.delete(key);
                return null;
            }

            const stats = statSync(cachePath);
            if (stats.size < 1024) {
                this.client.logger.warn(
                    `[AudioCacheManager] Cached file too small (${stats.size} bytes) for ${url.substring(0, 50)}..., removing invalid cache`,
                );
                this.cachedFiles.delete(key);
                rmSync(cachePath, { force: true });
                return null;
            }
        } catch (error) {
            this.client.logger.error(
                `[AudioCacheManager] Error validating cache for ${url.substring(0, 50)}...:`,
                error,
            );
            this.cachedFiles.delete(key);
            return null;
        }

        const cacheEntry = this.cachedFiles.get(key);
        if (cacheEntry) {
            cacheEntry.lastAccess = Date.now();
        }

        this.client.logger.info(`[AudioCacheManager] Cache hit for: ${url.substring(0, 50)}...`);
        return createReadStream(cachePath);
    }

    public cacheStream(url: string, sourceStream: Readable): Readable {
        const cachePath = this.getCachePath(url);
        const key = this.getCacheKey(url);

        this.inProgressFiles.add(key);

        this.inProgressProcs.set(key, { stream: sourceStream, writeStreamPath: cachePath });

        const playbackStream = new PassThrough();
        const cacheStream = new PassThrough();
        const writeStream = createWriteStream(cachePath);

        sourceStream.pipe(playbackStream);
        sourceStream.pipe(cacheStream);

        cacheStream.pipe(writeStream);

        writeStream.on("error", (error) => {
            this.client.logger.error("[AudioCacheManager] Error writing cache file:", error);
            this.inProgressFiles.delete(key);
            this.cachedFiles.delete(key);
            this.inProgressProcs.delete(key);
            try {
                rmSync(cachePath, { force: true });
            } catch {
                // Ignore errors
            }
        });

        writeStream.on("finish", () => {
            this.inProgressFiles.delete(key);
            this.inProgressProcs.delete(key);
            this.cachedFiles.set(key, {
                path: cachePath,
                lastAccess: Date.now(),
            });
            this.client.logger.info(
                `[AudioCacheManager] Cached audio for: ${url.substring(0, 50)}...`,
            );
            this.failedUrls.delete(key);
            void this.cleanupOldCache();
        });

        sourceStream.on("error", (error) => {
            this.client.logger.error("[AudioCacheManager] Source stream error:", error);
            playbackStream.destroy(error);
            this.inProgressFiles.delete(key);
            this.cachedFiles.delete(key);
            this.inProgressProcs.delete(key);
            try {
                rmSync(cachePath, { force: true });
            } catch {
                // Ignore errors
            }
        });

        return playbackStream;
    }

    public async preCacheUrl(url: string, priority = false): Promise<boolean> {
        if (this.isCached(url)) {
            return true;
        }

        const key = this.getCacheKey(url);
        if (this.inProgressFiles.has(key)) {
            return true;
        }

        const failedInfo = this.failedUrls.get(key);
        if (failedInfo && failedInfo.count >= PRE_CACHE_RETRY_COUNT) {
            const timeSinceLastAttempt = Date.now() - failedInfo.lastAttempt;
            if (timeSinceLastAttempt < 60000) {
                return false;
            }
            this.failedUrls.delete(key);
        }

        if (priority) {
            const index = this.preCacheQueue.indexOf(url);
            if (index > 0) {
                this.preCacheQueue.splice(index, 1);
            }
            if (index !== 0) {
                this.preCacheQueue.unshift(url);
            }
        } else if (!this.preCacheQueue.includes(url)) {
            this.preCacheQueue.push(url);
        }

        void this.processQueue();
        return true;
    }

    public async preCacheMultiple(urls: string[]): Promise<void> {
        for (const url of urls.slice(0, PRE_CACHE_AHEAD_COUNT)) {
            if (url && !this.isCached(url) && !this.isInProgress(url)) {
                await this.preCacheUrl(url);
            }
        }
    }

    public async waitForCache(url: string, timeoutMs = 300_000): Promise<boolean> {
        const key = this.getCacheKey(url);

        if (this.isCached(url) && !this.isInProgress(url)) {
            return true;
        }

        if (!this.isInProgress(url) && !this.isCached(url)) {
            this.client.logger.info(
                `[AudioCacheManager] Cache not found for ${url.substring(0, 50)}..., starting high-priority cache`,
            );
            await this.preCacheUrl(url, true);
        }

        const startTime = Date.now();
        const pollInterval = 200;

        return new Promise<boolean>((resolve) => {
            const checkCache = setInterval(() => {
                if (this.isCached(url) && !this.inProgressFiles.has(key)) {
                    clearInterval(checkCache);
                    this.client.logger.info(
                        `[AudioCacheManager] Cache completed for ${url.substring(0, 50)}... after ${Date.now() - startTime}ms`,
                    );
                    resolve(true);
                    return;
                }

                if (Date.now() - startTime >= timeoutMs) {
                    clearInterval(checkCache);
                    this.client.logger.warn(
                        `[AudioCacheManager] Timeout waiting for cache ${url.substring(0, 50)}... after ${timeoutMs}ms`,
                    );
                    resolve(false);
                    return;
                }

                const failedInfo = this.failedUrls.get(key);
                if (failedInfo && failedInfo.count >= PRE_CACHE_RETRY_COUNT) {
                    clearInterval(checkCache);
                    this.client.logger.warn(
                        `[AudioCacheManager] Cache failed for ${url.substring(0, 50)}... after ${failedInfo.count} attempts`,
                    );
                    resolve(false);
                    return;
                }
            }, pollInterval);
        });
    }

    private async processQueue(): Promise<void> {
        if (this.isProcessingQueue || this.preCacheQueue.length === 0) {
            return;
        }

        this.isProcessingQueue = true;

        while (this.preCacheQueue.length > 0) {
            const url = this.preCacheQueue.shift();
            if (!url) {
                continue;
            }

            if (this.isCached(url) || this.isInProgress(url)) {
                continue;
            }

            await this.doPreCache(url);
            await new Promise((resolve) => setTimeout(resolve, QUEUE_PROCESSING_DELAY_MS));
        }

        this.isProcessingQueue = false;
    }

    private async doPreCache(url: string, retryCount = 0): Promise<void> {
        const key = this.getCacheKey(url);

        try {
            const cachePath = this.getCachePath(url);

            this.inProgressFiles.add(key);

            if (await this.isDirectDownload(url)) {
                const writeStream = createWriteStream(cachePath);
                const httpStream = got.stream(url);

                this.inProgressProcs.set(key, { stream: httpStream, writeStreamPath: cachePath });

                httpStream.on("error", (err: Error) => {
                    this.client.logger.warn(
                        `[AudioCacheManager] HTTP pre-cache stream error for ${url.substring(0, 50)}...: ${err.message}`,
                    );
                    this.inProgressFiles.delete(key);
                    this.inProgressProcs.delete(key);
                    this.markFailed(key);
                    try {
                        rmSync(cachePath, { force: true });
                    } catch {
                        // Ignore errors
                    }
                });

                httpStream.pipe(writeStream);

                await new Promise<void>((resolve) => {
                    writeStream.on("finish", () => {
                        this.inProgressFiles.delete(key);
                        this.inProgressProcs.delete(key);
                        try {
                            const stats = statSync(cachePath);
                            if (stats.size >= 1024) {
                                this.cachedFiles.set(key, {
                                    path: cachePath,
                                    lastAccess: Date.now(),
                                });
                                this.failedUrls.delete(key);
                                this.client.logger.info(
                                    `[AudioCacheManager] Pre-cached audio for: ${url.substring(0, 50)}...`,
                                );
                            } else {
                                rmSync(cachePath, { force: true });
                                this.markFailed(key);
                            }
                        } catch {
                            this.markFailed(key);
                        }
                        resolve();
                    });

                    writeStream.on("error", () => {
                        this.inProgressFiles.delete(key);
                        this.markFailed(key);
                        try {
                            rmSync(cachePath, { force: true });
                        } catch {
                            // Ignore errors
                        }
                        resolve();
                    });
                });
            } else {
                const { exec, isBotDetectionError } = await import("../yt-dlp/index.js");

                const proc = exec(
                    url,
                    {
                        output: "-",
                        quiet: true,
                        format: "bestaudio",
                        limitRate: "300K",
                    },
                    { stdio: ["ignore", "pipe", "pipe"] },
                );

                this.inProgressProcs.set(key, { proc, writeStreamPath: cachePath });

                if (!proc.stdout) {
                    this.inProgressFiles.delete(key);
                    this.markFailed(key);
                    return;
                }

                let stderrData = "";
                let hasBotDetectionError = false;
                let processKilled = false;

                if (proc.stderr) {
                    proc.stderr.on("data", (chunk: Buffer) => {
                        stderrData += chunk.toString();
                        if (
                            isBotDetectionError(stderrData) &&
                            !hasBotDetectionError &&
                            !processKilled
                        ) {
                            hasBotDetectionError = true;
                            processKilled = true;
                            proc.kill("SIGKILL");

                            this.client.logger.warn(
                                `[AudioCacheManager] Bot detection during pre-cache, rotating cookie (attempt ${retryCount + 1}/${MAX_PRE_CACHE_RETRIES}). URL: ${url.substring(0, 50)}...`,
                            );
                            const rotated = this.client.cookies.rotateOnFailure();
                            if (rotated) {
                                this.client.logger.info(
                                    `[AudioCacheManager] Rotated to cookie ${this.client.cookies.getCurrentCookieIndex()}`,
                                );
                            }
                        }
                    });
                }

                const writeStream = createWriteStream(cachePath);
                proc.stdout.pipe(writeStream);

                await new Promise<void>((resolve) => {
                    writeStream.on("finish", () => {
                        this.inProgressFiles.delete(key);
                        this.inProgressProcs.delete(key);
                        if (hasBotDetectionError) {
                            try {
                                rmSync(cachePath, { force: true });
                            } catch {
                                // Ignore errors
                            }

                            if (
                                retryCount < MAX_PRE_CACHE_RETRIES &&
                                !this.client.cookies.areAllCookiesFailed()
                            ) {
                                setTimeout(
                                    () => {
                                        void this.doPreCache(url, retryCount + 1);
                                    },
                                    1000 * (retryCount + 1),
                                );
                            } else {
                                this.markFailed(key);
                            }
                        } else {
                            try {
                                const stats = statSync(cachePath);
                                if (stats.size >= 1024) {
                                    this.cachedFiles.set(key, {
                                        path: cachePath,
                                        lastAccess: Date.now(),
                                    });
                                    this.failedUrls.delete(key);
                                    this.client.logger.info(
                                        `[AudioCacheManager] Pre-cached audio for: ${url.substring(0, 50)}...`,
                                    );
                                } else {
                                    rmSync(cachePath, { force: true });
                                    this.markFailed(key);
                                }
                            } catch {
                                this.markFailed(key);
                            }
                        }
                        resolve();
                    });

                    writeStream.on("error", () => {
                        this.inProgressFiles.delete(key);
                        this.inProgressProcs.delete(key);
                        this.markFailed(key);
                        try {
                            rmSync(cachePath, { force: true });
                        } catch {
                            // Ignore errors
                        }
                        resolve();
                    });

                    proc.on("error", () => {
                        this.inProgressFiles.delete(key);
                        this.inProgressProcs.delete(key);
                        this.markFailed(key);
                        try {
                            rmSync(cachePath, { force: true });
                        } catch {
                            // Ignore errors
                        }
                        resolve();
                    });
                });
            }

            void this.cleanupOldCache();
        } catch (error) {
            this.inProgressFiles.delete(key);
            this.markFailed(key);
            this.client.logger.debug(
                `[AudioCacheManager] Failed to pre-cache: ${(error as Error).message}`,
            );
        }
    }

    private markFailed(key: string): void {
        const existing = this.failedUrls.get(key);
        this.failedUrls.set(key, {
            count: (existing?.count ?? 0) + 1,
            lastAttempt: Date.now(),
        });
    }

    private async cleanupOldCache(): Promise<void> {
        const stats = this.getStats();

        if (stats.files > MAX_CACHE_FILES || stats.totalSize > MAX_CACHE_SIZE_MB * 1024 * 1024) {
            const sortedEntries = [...this.cachedFiles.entries()].sort(
                (a, b) => a[1].lastAccess - b[1].lastAccess,
            );

            let currentSize = stats.totalSize;
            let currentFiles = stats.files;

            for (const [key, entry] of sortedEntries) {
                if (
                    currentFiles <= MAX_CACHE_FILES / 2 &&
                    currentSize <= (MAX_CACHE_SIZE_MB / 2) * 1024 * 1024
                ) {
                    break;
                }

                try {
                    if (existsSync(entry.path)) {
                        const fileStats = statSync(entry.path);
                        rmSync(entry.path, { force: true });
                        currentSize -= fileStats.size;
                        currentFiles--;
                    }
                    this.cachedFiles.delete(key);
                } catch {
                    // Ignore errors
                }
            }

            this.client.logger.info(
                `[AudioCacheManager] Cleaned up cache: ${stats.files - currentFiles} files removed`,
            );
        }
    }

    public clearCache(): void {
        this.cachedFiles.clear();
        this.inProgressFiles.clear();
        this.failedUrls.clear();
        this.preCacheQueue.length = 0;

        if (existsSync(this.cacheDir)) {
            rmSync(this.cacheDir, { recursive: true, force: true });
            this.ensureCacheDir();
            this.client.logger.info("[AudioCacheManager] Cache cleared.");
        }
    }

    public clearFailedUrls(): void {
        this.failedUrls.clear();
        this.client.logger.info("[AudioCacheManager] Failed URL cache cleared.");
    }

    public clearCacheForUrls(urls: string[]): void {
        let removedCount = 0;
        for (const url of urls) {
            const key = this.getCacheKey(url);
            const entry = this.cachedFiles.get(key);
            if (entry) {
                try {
                    if (existsSync(entry.path)) {
                        rmSync(entry.path, { force: true });
                        removedCount++;
                    }
                    this.cachedFiles.delete(key);
                } catch {
                    // Ignore errors
                }
            }
            const procInfo = this.inProgressProcs.get(key);
            if (procInfo) {
                try {
                    if (procInfo.proc && typeof procInfo.proc.kill === "function") {
                        procInfo.proc.kill("SIGKILL");
                    }
                    if (procInfo.stream && typeof procInfo.stream.destroy === "function") {
                        procInfo.stream.destroy();
                    }
                    if (procInfo.writeStreamPath && existsSync(procInfo.writeStreamPath)) {
                        rmSync(procInfo.writeStreamPath, { force: true });
                        removedCount++;
                    }
                } catch {
                    // Ignore errors
                }
                this.inProgressProcs.delete(key);
            }

            this.inProgressFiles.delete(key);
            this.failedUrls.delete(key);
            const queueIndex = this.preCacheQueue.indexOf(url);
            if (queueIndex !== -1) {
                this.preCacheQueue.splice(queueIndex, 1);
            }
        }
        if (removedCount > 0) {
            this.client.logger.info(
                `[AudioCacheManager] Cleared cache for ${removedCount} songs from destroyed queue.`,
            );
        }
    }

    public getStats(): {
        files: number;
        totalSize: number;
        inProgress: number;
        failed: number;
        queued: number;
    } {
        let totalSize = 0;
        let files = 0;

        for (const [key, entry] of this.cachedFiles) {
            if (existsSync(entry.path)) {
                const stats = statSync(entry.path);
                totalSize += stats.size;
                files++;
            } else {
                this.cachedFiles.delete(key);
            }
        }

        return {
            files,
            totalSize,
            inProgress: this.inProgressFiles.size,
            failed: this.failedUrls.size,
            queued: this.preCacheQueue.length,
        };
    }
}
