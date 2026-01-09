import { type Buffer } from "node:buffer";
import { type Readable } from "node:stream";
import { clearTimeout, setTimeout } from "node:timers";
import got from "got";
import { enableAudioCache } from "../../config/env.js";
import { type Rawon } from "../../structures/Rawon.js";
import { type BasicYoutubeVideoInfo } from "../../typings/index.js";
import ytdl, { exec, isBotDetectionError } from "../yt-dlp/index.js";
import { checkQuery } from "./GeneralUtil.js";

export class AllCookiesFailedError extends Error {
    public constructor() {
        super(
            "All cookies have failed due to bot detection. Please add new cookies using the cookies command.",
        );
        this.name = "AllCookiesFailedError";
    }
}

export class CookieRotationNeededError extends Error {
    public constructor(
        message: string,
        public readonly shouldRequeue = true,
    ) {
        super(message);
        this.name = "CookieRotationNeededError";
    }
}

async function isDirectDownload(url: string): Promise<boolean> {
    try {
        const extRegex = /\.(mp4|m4a|webm|mp3|opus|wav|flac)(\?|$)/i;
        if (extRegex.test(url)) {
            return true;
        }

        const res = await got.head(url, { timeout: 2_000, throwHttpErrors: false });
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

export interface StreamResult {
    stream: Readable | null;
    cachePath: string | null;
}

export async function getStream(
    client: Rawon,
    url: string,
    isLive = false,
    seekSeconds = 0,
): Promise<StreamResult> {
    const isSoundcloudUrl = checkQuery(url);
    if (isSoundcloudUrl.sourceType === "soundcloud") {
        return {
            stream: client.soundcloud.util.streamTrack(url) as unknown as Readable,
            cachePath: null,
        };
    }

    if (enableAudioCache && !isLive && seekSeconds > 0) {
        client.logger.info(
            `[YTDLUtil] Seek position ${seekSeconds}s requested for ${url.substring(0, 50)}..., waiting for cache to complete`,
        );

        const cacheReady = await client.audioCache.waitForCache(url, 300_000);

        if (cacheReady) {
            const cacheStream = client.audioCache.getFromCache(url);
            if (cacheStream) {
                cacheStream.destroy();
                const cachePath = client.audioCache.getCachePath(url);
                client.logger.info(
                    `[YTDLUtil] ✅ Using cached file for ${url.substring(0, 50)}... with seek position ${seekSeconds}s`,
                );
                return {
                    stream: null,
                    cachePath,
                };
            }
        } else {
            client.logger.warn(
                `[YTDLUtil] ⚠️ Cache not ready after timeout for ${url.substring(0, 50)}..., falling back to stream (will play from beginning)`,
            );
        }
    }

    if (
        enableAudioCache &&
        !isLive &&
        seekSeconds === 0 &&
        client.audioCache.isCached(url) &&
        !client.audioCache.isInProgress(url)
    ) {
        const cacheStream = client.audioCache.getFromCache(url);
        if (cacheStream) {
            cacheStream.destroy();
            const cachePath = client.audioCache.getCachePath(url);
            client.logger.info(
                `[YTDLUtil] Using cached file for ${url.substring(0, 50)}... (seekSeconds=0)`,
            );
            return {
                stream: null,
                cachePath,
            };
        }
    }

    if (client.cookies.areAllCookiesFailed()) {
        throw new AllCookiesFailedError();
    }

    if (await isDirectDownload(url)) {
        try {
            const stream = got.stream(url);
            return {
                stream: stream as unknown as Readable,
                cachePath: null,
            };
        } catch (err) {
            client.logger.warn(
                `[YTDLUtil] Direct HTTP stream failed for ${url.substring(0, 50)}..., falling back to yt-dlp. Error: ${(err as Error).message}`,
            );
        }
    }

    const stream = await attemptStreamWithRetry(client, url, isLive, 0, seekSeconds);
    return {
        stream,
        cachePath: null,
    };
}

const MAX_COOKIE_RETRIES = 10;
const MAX_TRANSIENT_RETRIES = 3;
const STREAM_VALIDATION_DELAY_MS = 500;

async function attemptStreamWithRetry(
    client: Rawon,
    url: string,
    isLive: boolean,
    retryCount = 0,
    seekSeconds = 0,
): Promise<Readable> {
    return new Promise<Readable>((resolve, reject) => {
        const baseOptions: Record<string, unknown> = isLive
            ? {
                  output: "-",
                  quiet: true,
                  format: "best[acodec!=none]/bestaudio/best",
                  liveFromStart: false,
              }
            : {
                  output: "-",
                  quiet: true,
                  format: "bestaudio",
                  limitRate: "300K",
              };

        const options = { ...baseOptions };

        const proc = exec(url, options, { stdio: ["ignore", "pipe", "pipe"] });

        if (!proc.stdout) {
            reject(new Error("Error obtaining stdout from process."));
            return;
        }

        let stderrData = "";
        let hasDetectedBotError = false;
        let hasHandledError = false;
        let hasResolved = false;
        let validationTimeout: NodeJS.Timeout | null = null;

        const handleBotDetectionError = (): void => {
            if (hasHandledError) {
                return;
            }
            hasDetectedBotError = true;
            hasHandledError = true;

            if (validationTimeout) {
                clearTimeout(validationTimeout);
                validationTimeout = null;
            }

            client.logger.warn(
                `[YTDLUtil] ⚠️ Bot detection error detected, attempting cookie rotation (attempt ${retryCount + 1}/${MAX_COOKIE_RETRIES}). URL: ${url.substring(0, 50)}...`,
            );

            proc.kill("SIGKILL");

            if (retryCount >= MAX_COOKIE_RETRIES) {
                client.logger.error(
                    `[YTDLUtil] ❌ Maximum retry limit (${MAX_COOKIE_RETRIES}) reached for URL: ${url.substring(0, 50)}...`,
                );
                reject(new CookieRotationNeededError("Maximum cookie retries reached", true));
                return;
            }

            const rotated = client.cookies.rotateOnFailure();
            if (rotated) {
                client.logger.info(
                    `[YTDLUtil] 🔄 Rotated to cookie ${client.cookies.getCurrentCookieIndex()}, retrying...`,
                );
                attemptStreamWithRetry(client, url, isLive, retryCount + 1, seekSeconds)
                    .then(resolve)
                    .catch(reject);
            } else {
                client.logger.error(
                    "[YTDLUtil] ❌ All cookies have failed! Song will be re-queued for retry.",
                );
                reject(new CookieRotationNeededError("All cookies failed", true));
            }
        };

        const handleTransientError = (errorMessage: string): void => {
            if (hasHandledError) {
                return;
            }

            if (isTransientError(errorMessage)) {
                hasHandledError = true;
                if (validationTimeout) {
                    clearTimeout(validationTimeout);
                    validationTimeout = null;
                }
                proc.kill("SIGKILL");

                if (retryCount < MAX_TRANSIENT_RETRIES) {
                    client.logger.warn(
                        `[YTDLUtil] ⚠️ Transient error detected, retrying (attempt ${retryCount + 1}/${MAX_TRANSIENT_RETRIES}). URL: ${url.substring(0, 50)}...`,
                    );
                    setTimeout(
                        () => {
                            attemptStreamWithRetry(client, url, isLive, retryCount + 1, seekSeconds)
                                .then(resolve)
                                .catch(reject);
                        },
                        1000 * (retryCount + 1),
                    );
                } else {
                    reject(new Error(`Transient error after retries: ${errorMessage}`));
                }
            }
        };

        if (proc.stderr) {
            proc.stderr.on("data", (chunk: Buffer) => {
                stderrData += chunk.toString();
                if (isBotDetectionError(stderrData) && !hasDetectedBotError) {
                    handleBotDetectionError();
                } else {
                    handleTransientError(stderrData);
                }
            });
        }

        proc.once("error", (err) => {
            proc.kill("SIGKILL");
            if (validationTimeout) {
                clearTimeout(validationTimeout);
                validationTimeout = null;
            }
            if (!hasHandledError) {
                hasHandledError = true;
                reject(err);
            }
        });

        proc.stdout.once("error", (err) => {
            proc.kill("SIGKILL");
            if (validationTimeout) {
                clearTimeout(validationTimeout);
                validationTimeout = null;
            }
            if (!hasHandledError) {
                hasHandledError = true;
                reject(err);
            }
        });

        proc.once("close", (code) => {
            if (!hasResolved && !hasHandledError) {
                if (validationTimeout) {
                    clearTimeout(validationTimeout);
                    validationTimeout = null;
                }

                if (isBotDetectionError(stderrData)) {
                    handleBotDetectionError();
                } else if (code !== 0) {
                    hasHandledError = true;
                    const errorMsg = stderrData.trim() || `Process exited with code ${code}`;
                    if (isTransientError(errorMsg) && retryCount < MAX_TRANSIENT_RETRIES) {
                        setTimeout(
                            () => {
                                attemptStreamWithRetry(
                                    client,
                                    url,
                                    isLive,
                                    retryCount + 1,
                                    seekSeconds,
                                )
                                    .then(resolve)
                                    .catch(reject);
                            },
                            1000 * (retryCount + 1),
                        );
                    } else {
                        reject(new Error(`yt-dlp process exited with code ${code}: ${stderrData}`));
                    }
                }
            }
        });

        if (!isLive) {
            proc.stdout.once("end", () => {
                proc.kill("SIGKILL");
            });
        }

        void proc.once("spawn", () => {
            if (hasHandledError) {
                return;
            }

            validationTimeout = setTimeout(() => {
                validationTimeout = null;

                if (hasHandledError || hasDetectedBotError) {
                    return;
                }

                if (isBotDetectionError(stderrData)) {
                    handleBotDetectionError();
                    return;
                }

                hasResolved = true;

                if (isLive || !enableAudioCache || seekSeconds > 0) {
                    resolve(proc.stdout as unknown as Readable);
                    return;
                }

                const passthroughStream = client.audioCache.cacheStream(
                    url,
                    proc.stdout as unknown as Readable,
                );
                resolve(passthroughStream);
            }, STREAM_VALIDATION_DELAY_MS);
        });
    });
}

function isTransientError(errorMessage: string): boolean {
    const transientPatterns = [
        "connection reset",
        "connection timed out",
        "temporarily unavailable",
        "network is unreachable",
        "unable to download",
        "http error 503",
        "http error 502",
        "http error 500",
    ];
    const lowerError = errorMessage.toLowerCase();
    return transientPatterns.some((pattern) => lowerError.includes(pattern));
}

export async function getInfo(url: string, client?: Rawon): Promise<BasicYoutubeVideoInfo> {
    if (client?.cookies.areAllCookiesFailed()) {
        throw new AllCookiesFailedError();
    }

    return attemptGetInfoWithRetry(url, client, 0);
}

async function attemptGetInfoWithRetry(
    url: string,
    client?: Rawon,
    retryCount = 0,
): Promise<BasicYoutubeVideoInfo> {
    try {
        const result = await ytdl(url, {
            dumpJson: true,
        });
        return result;
    } catch (error) {
        const errorMessage = (error as Error)?.message ?? String(error ?? "");

        if (isBotDetectionError(errorMessage) && client) {
            client.logger.warn(
                `[YTDLUtil] ⚠️ Bot detection in getInfo, rotating cookie (attempt ${retryCount + 1}/${MAX_COOKIE_RETRIES}). URL: ${url.substring(0, 50)}...`,
            );

            if (retryCount >= MAX_COOKIE_RETRIES) {
                client.logger.error(
                    `[YTDLUtil] ❌ Maximum retry limit (${MAX_COOKIE_RETRIES}) reached in getInfo`,
                );
                throw new AllCookiesFailedError();
            }

            const rotated = client.cookies.rotateOnFailure();
            if (rotated) {
                client.logger.info(
                    `[YTDLUtil] 🔄 Retrying getInfo with cookie ${client.cookies.getCurrentCookieIndex()}`,
                );
                return attemptGetInfoWithRetry(url, client, retryCount + 1);
            }
            throw new AllCookiesFailedError();
        }

        if (isTransientError(errorMessage) && retryCount < MAX_TRANSIENT_RETRIES) {
            client?.logger.warn(
                `[YTDLUtil] ⚠️ Transient error in getInfo, retrying (attempt ${retryCount + 1}/${MAX_TRANSIENT_RETRIES}). URL: ${url.substring(0, 50)}...`,
            );
            await new Promise((resolve) => setTimeout(resolve, 1000 * (retryCount + 1)));
            return attemptGetInfoWithRetry(url, client, retryCount + 1);
        }

        throw error;
    }
}

export function shouldRequeueOnError(error: Error): boolean {
    if (error instanceof CookieRotationNeededError) {
        return error.shouldRequeue;
    }
    if (error instanceof AllCookiesFailedError) {
        return false;
    }
    const errorMessage = error.message.toLowerCase();
    return (
        isBotDetectionError(errorMessage) ||
        isTransientError(errorMessage) ||
        errorMessage.includes("socket hang up") ||
        errorMessage.includes("econnreset")
    );
}
