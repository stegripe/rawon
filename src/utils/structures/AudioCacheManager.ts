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

    public constructor(public readonly client: Rawon) {
        this.cacheDir = path.resolve(process.cwd(), ".audio-cache");
        this.ensureCacheDir();
    }

    private ensureCacheDir(): void {
        if (!existsSync(this.cacheDir)) {
            mkdirSync(this.cacheDir, { recursive: true });
            this.client.logger.info("[AudioCacheManager] Cache directory created.");
        }
    }

    /**
     * Generate a unique cache key for a URL
     */
    public getCacheKey(url: string): string {
        return createHash("md5").update(url).digest("hex");
    }

    /**
     * Get the file path for a cached audio
     */
    public getCachePath(url: string): string {
        const key = this.getCacheKey(url);
        return path.join(this.cacheDir, `${key}.opus`);
    }

    /**
     * Check if an audio file is cached
     */
    public isCached(url: string): boolean {
        const cachePath = this.getCachePath(url);
        const inMemory = this.cachedFiles.has(this.getCacheKey(url));

        if (inMemory) {
            return existsSync(cachePath);
        }

        // Check file system
        if (existsSync(cachePath)) {
            // Add to in-memory tracking
            this.cachedFiles.set(this.getCacheKey(url), {
                path: cachePath,
                lastAccess: Date.now(),
            });
            return true;
        }

        return false;
    }

    /**
     * Get a readable stream from cache
     */
    public getFromCache(url: string): ReadStream | null {
        if (!this.isCached(url)) {
            return null;
        }

        const cachePath = this.getCachePath(url);
        const key = this.getCacheKey(url);

        // Update last access time
        const cacheEntry = this.cachedFiles.get(key);
        if (cacheEntry) {
            cacheEntry.lastAccess = Date.now();
        }

        this.client.logger.info(`[AudioCacheManager] Cache hit for: ${url.substring(0, 50)}...`);
        return createReadStream(cachePath);
    }

    /**
     * Cache a stream and return a passthrough stream for immediate consumption
     * This allows the audio to be played while being cached simultaneously
     */
    public async cacheStream(url: string, sourceStream: Readable): Promise<Readable> {
        const cachePath = this.getCachePath(url);
        const key = this.getCacheKey(url);

        const passthrough = new PassThrough();
        const writeStream = createWriteStream(cachePath);

        // Track this cache entry
        this.cachedFiles.set(key, {
            path: cachePath,
            lastAccess: Date.now(),
        });

        // Pipe to both the passthrough (for playback) and file (for caching)
        sourceStream.pipe(passthrough);
        sourceStream.pipe(writeStream);

        writeStream.on("error", (error) => {
            this.client.logger.error("[AudioCacheManager] Error writing cache file:", error);
            // Remove failed cache entry
            this.cachedFiles.delete(key);
            try {
                rmSync(cachePath, { force: true });
            } catch {
                // Ignore cleanup errors
            }
        });

        writeStream.on("finish", () => {
            this.client.logger.info(
                `[AudioCacheManager] Cached audio for: ${url.substring(0, 50)}...`,
            );
        });

        sourceStream.on("error", (error) => {
            this.client.logger.error("[AudioCacheManager] Source stream error:", error);
            // Clean up partial cache file
            this.cachedFiles.delete(key);
            try {
                rmSync(cachePath, { force: true });
            } catch {
                // Ignore cleanup errors
            }
        });

        return passthrough;
    }

    /**
     * Clear all cached audio files
     */
    public clearCache(): void {
        this.cachedFiles.clear();

        if (existsSync(this.cacheDir)) {
            rmSync(this.cacheDir, { recursive: true, force: true });
            this.ensureCacheDir();
            this.client.logger.info("[AudioCacheManager] Cache cleared.");
        }
    }

    /**
     * Get cache statistics
     */
    public getStats(): { files: number; totalSize: number } {
        let totalSize = 0;
        let files = 0;

        for (const [key, entry] of this.cachedFiles) {
            if (existsSync(entry.path)) {
                const stats = statSync(entry.path);
                totalSize += stats.size;
                files++;
            } else {
                // Clean up stale entry
                this.cachedFiles.delete(key);
            }
        }

        return { files, totalSize };
    }
}
