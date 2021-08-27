/* eslint-disable @typescript-eslint/restrict-plus-operands */
import { ServerQueue } from "../structures/ServerQueue";
import { Channel, Client, Collection, Guild, Presence, Snowflake, User } from "discord.js";
import { FFmpeg, FFmpegInfo } from "prism-media";
import { promises as fs } from "fs";
import { request } from "https";
import prettyMilliseconds from "pretty-ms";
import path from "path";

export class Util {
    public constructor(public client: Client) {}

    public bytesToSize(bytes: number): string {
        if (isNaN(bytes) && bytes !== 0) throw new Error(`[bytesToSize] (bytes) Error: bytes is not a Number/Integer, received: ${typeof bytes}`);
        const sizes: string[] = ["B", "KiB", "MiB", "GiB", "TiB", "PiB"];
        if (bytes < 2 && bytes > 0) return `${bytes} Byte`;
        const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)).toString());
        if (i === 0) return `${bytes} ${sizes[i]}`;
        if (!sizes[i]) return `${bytes} ${sizes[sizes.length - 1]}`;
        return `${Number(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
    }

    public formatMS(ms: number): string {
        if (isNaN(ms)) throw new Error("value is not a number.");
        return prettyMilliseconds(ms, {
            verbose: true,
            compact: false,
            secondsDecimalDigits: 0
        });
    }

    public async getPackageJSON(pkgName?: string): Promise<any> {
        if (process.platform === "win32") pkgName = pkgName?.replace("/", "\\");
        const resolvedPath = path.resolve(pkgName ? require.resolve(pkgName) : process.cwd());
        const resolvedPkgName = pkgName ?? path.parse(process.cwd()).name;
        const resolvedPackageJSONPath = path.resolve(resolvedPath.split(resolvedPkgName)[0], resolvedPkgName, "package.json");
        return JSON.parse((await fs.readFile(resolvedPackageJSONPath)).toString());
    }

    public async getOpusEncoder(): Promise<any> {
        if (this.doesFFmpegHasLibOpus()) {
            return {
                encoder: "ffmpeg",
                pkgMetadata: {
                    name: "ffmpeg libopus",
                    version: this.getFFmpegVersion()
                }
            };
        }

        const list = ["@discordjs/opus", "opusscript"];
        const errorLog = [];
        for (const name of list) {
            try {
                const data = (await import(name)).default;
                const pkgMetadata = await this.getPackageJSON(name);
                return { encoder: name === "@discordjs/opus" ? data.OpusEncoder : data, pkgMetadata };
            } catch (e) {
                errorLog.push(e);
            }
        }
        throw new Error(errorLog.join("\n"));
    }

    public getFFmpegInfo(): FFmpegInfo {
        return FFmpeg.getInfo();
    }

    public getFFmpegVersion(): string {
        const info = this.getFFmpegInfo();

        // if the ffmpeg-static is used
        if (info.command.includes("ffmpeg-static")) return info.version.replace("https://johnvansickle.com/ffmpeg/", "");

        return info.version.startsWith("n") ? info.version.slice(1) : info.version;
    }

    public doesFFmpegHasLibOpus(): boolean {
        return this.getFFmpegInfo().output.includes("--enable-libopus");
    }

    public async getResource<T extends keyof getResourceResourceType>(type: T | keyof getResourceResourceType): Promise<getResourceReturnType<T>> {
        // Functions how to get the resources
        const resourcesFunctions: Record<keyof getResourceResourceType, (client: Client) => Collection<any, any>> = {
            users: (client: Client) => client.users.cache,
            channels: (client: Client) => client.channels.cache,
            guilds: (client: Client) => client.guilds.cache,
            queues: (client: Client) => client.queue.mapValues(v => v.toJSON())
        };

        /*
            Why do we convert these functions to string? because we can't pass a function to a broadcastEval context, so we convert them to string.
            Then in the broadcastEval context, we convert them again to function using eval, then execute that function
        */
        const doBroadcastEval = (): any => this.client.shard?.broadcastEval(
            // eslint-disable-next-line no-eval
            (client, ctx) => eval(ctx.resourcesFunctions[ctx.type])(client),
            { context: { type, resourcesFunctions: Object.fromEntries(Object.entries(resourcesFunctions).map(o => [o[0], o[1].toString()])) } }
        );

        const evalResult = await doBroadcastEval() ?? resourcesFunctions[type](this.client);

        let result: getResourceReturnType<T>;
        if (this.client.shard) {
            result = new Collection<Snowflake, getResourceResourceType[T]>(
                await this._getMergedBroadcastEval<getResourceResourceType[T]>(evalResult as (getResourceResourceType[T])[][])
            );
        } else { result = evalResult as getResourceReturnType<T>; }
        return result;
    }

    public async getGuildsCount(): Promise<number> {
        return (await this.getResource("guilds")).size;
    }

    public async getChannelsCount(filter = true): Promise<number> {
        const channels = await this.getResource("channels");

        if (filter) return channels.filter(c => c.type !== "GUILD_CATEGORY" && c.type !== "DM").size;
        return channels.size;
    }

    public async getUsersCount(filter = true): Promise<number> {
        const users = await this.getResource("users");

        if (filter) return users.filter(u => u.id === this.client.user!.id).size;
        return users.size;
    }

    public async getTotalPlaying(): Promise<number> {
        return (await this.getResource("queues")).filter(q => q.playing).size;
    }

    public hastebin(text: string): Promise<string> {
        return new Promise((resolve, reject) => {
            const req = request({ hostname: "bin.hzmi.xyz", path: "/documents", method: "POST", minVersion: "TLSv1.3" }, res => {
                let raw = "";
                res.on("data", chunk => raw += chunk);
                res.on("end", () => {
                    if (res.statusCode! >= 200 && res.statusCode! < 300) return resolve(`https://bin.hzmi.xyz/${JSON.parse(raw).key as string}`);
                    return reject(new Error(`[hastebin] Error while trying to send data to https://bin.hzmi.xyz/documents, ${res.statusCode as number} ${res.statusMessage as string}`));
                });
            }).on("error", reject);
            req.write(typeof text === "object" ? JSON.stringify(text, null, 2) : text);
            req.end();
        });
    }

    public paginate(text: string, limit = 2000): any[] {
        const lines = text.trim().split("\n");
        const pages = [];
        let chunk = "";

        for (const line of lines) {
            if (chunk.length + line.length > limit && chunk.length > 0) {
                pages.push(chunk);
                chunk = "";
            }

            if (line.length > limit) {
                const lineChunks = line.length / limit;

                for (let i = 0; i < lineChunks; i++) {
                    const start = i * limit;
                    const end = start + limit;
                    pages.push(line.slice(start, end));
                }
            } else {
                chunk += `${line}\n`;
            }
        }

        if (chunk.length > 0) {
            pages.push(chunk);
        }

        return pages;
    }

    public chunk(array: Array<any> | string, chunkSize: number): Array<any> {
        const temp = [];
        for (let i = 0; i < array.length; i += chunkSize) {
            temp.push(array.slice(i, i + chunkSize));
        }
        return temp;
    }

    public getUserFromMention(mention: string): Promise<User | undefined> {
        const matches = /^<@!?(\d+)>$/.exec(mention);
        if (!matches) return Promise.resolve(undefined);

        const id = matches[1];
        return this.client.users.fetch(id);
    }

    public async updatePresence(): Promise<Presence | undefined> {
        const activityName = this.client.config.status.activity
            .replace(/{guildsCount}/g, (await this.getGuildsCount()).toString())
            .replace(/{playingCount}/g, (await this.getTotalPlaying()).toString())
            .replace(/{usersCount}/g, (await this.getUsersCount()).toString())
            .replace(/{botPrefix}/g, this.client.config.prefix);
        return this.client.user!.setPresence({
            activities: [{ name: activityName, type: this.client.config.status.type }]
        });
    }

    private _getMergedBroadcastEval<T>(broadcastEval: T[][]): Iterable<[Snowflake, T]> {
        return broadcastEval.reduce((p, c) => [...p, ...c]) as Iterable<[Snowflake, T]>;
    }
}

interface getResourceResourceType {
    users: User;
    channels: Channel;
    guilds: Guild;
    queues: ServerQueue;
}
type getResourceReturnType<T extends keyof getResourceResourceType> = Collection<Snowflake, getResourceResourceType[T]>;
