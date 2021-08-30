export class YouTubeError extends Error {
    public constructor(message: string, originalErr?: Error) {
        super(message);
        this.name = "YouTubeError";
        this.stack = `${message}${originalErr ? `, err: ${originalErr.stack!}` : ""}`;
        this.message = `${message}${originalErr ? `, err: ${originalErr.message}` : ""}`;
    }
}
