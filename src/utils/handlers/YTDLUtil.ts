import { type Buffer } from "node:buffer";
import { type Readable } from "node:stream";
import { enableAudioCache } from "../../config/env.js";
import { type Rawon } from "../../structures/Rawon.js";
import { type BasicYoutubeVideoInfo } from "../../typings/index.js";
import ytdl, { exec, isBotDetectionError } from "../yt-dlp/index.js";
import { checkQuery } from "./GeneralUtil.js";

/**
 * Custom error class for when all cookies have failed
 */
export class AllCookiesFailedError extends Error {
    public constructor() {
        super(
            "All cookies have failed due to bot detection. Please add new cookies using the cookies command.",
        );
        this.name = "AllCookiesFailedError";
    }
}

export async function getStream(client: Rawon, url: string, isLive = false): Promise<Readable> {
    const isSoundcloudUrl = checkQuery(url);
    if (isSoundcloudUrl.sourceType === "soundcloud") {
        return client.soundcloud.util.streamTrack(url) as unknown as Readable;
    }

    if (enableAudioCache && !isLive && client.audioCache.isCached(url)) {
        const cachedStream = client.audioCache.getFromCache(url);
        if (cachedStream !== null) {
            return cachedStream;
        }
    }

    // Check if all cookies have already failed
    if (client.cookies.areAllCookiesFailed()) {
        throw new AllCookiesFailedError();
    }

    return attemptStreamWithRetry(client, url, isLive);
}

async function attemptStreamWithRetry(
    client: Rawon,
    url: string,
    isLive: boolean,
): Promise<Readable> {
    return new Promise<Readable>((resolve, reject) => {
        const options = isLive
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

        const proc = exec(url, options, { stdio: ["ignore", "pipe", "pipe"] });

        if (!proc.stdout) {
            reject(new Error("Error obtaining stdout from process."));
            return;
        }

        let stderrData = "";
        let hasDetectedBotError = false;

        if (proc.stderr) {
            proc.stderr.on("data", (chunk: Buffer) => {
                stderrData += chunk.toString();
                if (isBotDetectionError(stderrData) && !hasDetectedBotError) {
                    hasDetectedBotError = true;
                    client.logger.error(
                        `[YTDLUtil] Bot detection error detected, attempting cookie rotation. URL: ${url}`,
                    );

                    // Kill the current process and try to rotate cookies
                    proc.kill("SIGKILL");

                    // Attempt to rotate to next cookie
                    const rotated = client.cookies.rotateOnFailure();
                    if (rotated) {
                        // Retry with new cookie
                        client.logger.info(
                            `[YTDLUtil] Retrying with cookie ${client.cookies.getCurrentCookieIndex()}`,
                        );
                        attemptStreamWithRetry(client, url, isLive).then(resolve).catch(reject);
                    } else {
                        // All cookies have failed
                        reject(new AllCookiesFailedError());
                    }
                }
            });
        }

        proc.once("error", (err) => {
            proc.kill("SIGKILL");
            if (!hasDetectedBotError) {
                reject(err);
            }
        });

        proc.stdout.once("error", (err) => {
            proc.kill("SIGKILL");
            if (!hasDetectedBotError) {
                reject(err);
            }
        });

        if (!isLive) {
            proc.stdout.once("end", () => {
                proc.kill("SIGKILL");
            });
        }

        void proc.once("spawn", () => {
            if (hasDetectedBotError) {
                return;
            }

            if (isLive || !enableAudioCache) {
                resolve(proc.stdout as unknown as Readable);
                return;
            }

            const passthroughStream = client.audioCache.cacheStream(
                url,
                proc.stdout as unknown as Readable,
            );
            resolve(passthroughStream);
        });
    });
}

export async function getInfo(url: string, client?: Rawon): Promise<BasicYoutubeVideoInfo> {
    // Check if all cookies have already failed
    if (client?.cookies.areAllCookiesFailed()) {
        throw new AllCookiesFailedError();
    }

    return attemptGetInfoWithRetry(url, client);
}

async function attemptGetInfoWithRetry(
    url: string,
    client?: Rawon,
): Promise<BasicYoutubeVideoInfo> {
    try {
        const result = await ytdl(url, {
            dumpJson: true,
        });
        return result;
    } catch (error) {
        const errorMessage = (error as Error)?.message ?? String(error ?? "");
        if (isBotDetectionError(errorMessage) && client) {
            client.logger.error(
                `[YTDLUtil] Bot detection error in getInfo, attempting cookie rotation. URL: ${url}`,
            );

            // Attempt to rotate to next cookie
            const rotated = client.cookies.rotateOnFailure();
            if (rotated) {
                // Retry with new cookie
                client.logger.info(
                    `[YTDLUtil] Retrying getInfo with cookie ${client.cookies.getCurrentCookieIndex()}`,
                );
                return attemptGetInfoWithRetry(url, client);
            }
            // All cookies have failed
            throw new AllCookiesFailedError();
        }
        throw error;
    }
}
