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
import { type Rawon } from "../../structures/Rawon.js";

export class AudioCacheManager {
    public readonly cacheDir: string;
    private readonly cachedFiles = new Map<string, { path: string; lastAccess: number }>();
    private readonly inProgressFiles = new Set<string>();

    public constructor(public readonly client: Rawon) {
        this.cacheDir = path.resolve(process.cwd(), "cache", "audio");
        this.clearCacheOnStartup();
    }

    private clearCacheOnStartup(): void {
        if (existsSync(this.cacheDir)) {
            rmSync(this.cacheDir, { recursive: true, force: true });
            this.client.logger.info("[AudioCacheManager] Cleared old cache files on startup.");
        }
        this.ensureCacheDir();
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

    public getFromCache(url: string): ReadStream | null {
        if (!this.isCached(url)) {
            return null;
        }

        const cachePath = this.getCachePath(url);
        const key = this.getCacheKey(url);

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
            try {
                rmSync(cachePath, { force: true });
            } catch {
                // Ignore cleanup errors
            }
        });

        writeStream.on("finish", () => {
            this.inProgressFiles.delete(key);
            this.cachedFiles.set(key, {
                path: cachePath,
                lastAccess: Date.now(),
            });
            this.client.logger.info(
                `[AudioCacheManager] Cached audio for: ${url.substring(0, 50)}...`,
            );
        });

        sourceStream.on("error", (error) => {
            this.client.logger.error("[AudioCacheManager] Source stream error:", error);
            playbackStream.destroy(error);
            this.inProgressFiles.delete(key);
            this.cachedFiles.delete(key);
            try {
                rmSync(cachePath, { force: true });
            } catch {
                // Ignore cleanup errors
            }
        });

        return playbackStream;
    }

    public async preCacheUrl(url: string): Promise<void> {
        if (this.isCached(url)) {
            return;
        }

        const key = this.getCacheKey(url);
        if (this.inProgressFiles.has(key)) {
            return;
        }

        try {
            const { exec } = await import("../yt-dlp/index.js");
            const cachePath = this.getCachePath(url);

            this.inProgressFiles.add(key);

            const proc = exec(
                url,
                {
                    output: "-",
                    quiet: true,
                    format: "bestaudio",
                    limitRate: "300K",
                },
                { stdio: ["ignore", "pipe", "ignore"] },
            );

            if (!proc.stdout) {
                this.inProgressFiles.delete(key);
                return;
            }

            const writeStream = createWriteStream(cachePath);
            proc.stdout.pipe(writeStream);

            writeStream.on("finish", () => {
                this.inProgressFiles.delete(key);
                this.cachedFiles.set(key, {
                    path: cachePath,
                    lastAccess: Date.now(),
                });
                this.client.logger.info(
                    `[AudioCacheManager] Pre-cached audio for: ${url.substring(0, 50)}...`,
                );
            });

            writeStream.on("error", () => {
                this.inProgressFiles.delete(key);
                try {
                    rmSync(cachePath, { force: true });
                } catch {
                    // Ignore cleanup errors
                }
            });

            proc.on("error", () => {
                this.inProgressFiles.delete(key);
                try {
                    rmSync(cachePath, { force: true });
                } catch {
                    // Ignore cleanup errors
                }
            });
        } catch (error) {
            this.inProgressFiles.delete(key);
            this.client.logger.debug(
                `[AudioCacheManager] Failed to pre-cache: ${(error as Error).message}`,
            );
        }
    }

    public clearCache(): void {
        this.cachedFiles.clear();
        this.inProgressFiles.clear();

        if (existsSync(this.cacheDir)) {
            rmSync(this.cacheDir, { recursive: true, force: true });
            this.ensureCacheDir();
            this.client.logger.info("[AudioCacheManager] Cache cleared.");
        }
    }

    public getStats(): { files: number; totalSize: number; inProgress: number } {
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

        return { files, totalSize, inProgress: this.inProgressFiles.size };
    }
}
