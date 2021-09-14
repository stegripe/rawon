/* eslint-disable @typescript-eslint/restrict-plus-operands */
import { Channel, Client, Presence, User } from "discord.js";
import prettyMilliseconds from "pretty-ms";
import { request } from "https";
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

    public getPackageJSON(pkgName = process.cwd()): Promise<any> {
        if (process.platform === "win32") pkgName = pkgName.replace("/", "\\");
        const resolvedPath = path.resolve(require.resolve(pkgName));
        return import(path.resolve(resolvedPath.split(pkgName)[0], pkgName, "package.json"));
    }

    public async getOpusEncoder(): Promise<any> {
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

    public async getGuildsCount(): Promise<number> {
        const fn = (client: Client): number => client.guilds.cache.size;

        return await this.broadcastEvalSize(`eval(${fn.toString()})(this)`) ?? fn(this.client);
    }

    public async getChannelsCount(filter = true): Promise<number> {
        const fn = (client: Client, filter: (c: Channel) => boolean): number => client.channels.cache.filter(filter).size;
        const filterFn = filter ? (c: Channel): boolean => c.type !== "category" && c.type !== "dm" : () => true;

        return await this.broadcastEvalSize(`eval(${fn.toString()})(this, ${filterFn.toString()})`) ?? fn(this.client, filterFn);
    }

    public async getUsersCount(filter = true): Promise<number> {
        const fn = (client: Client, filter: (u: User) => boolean): number => client.users.cache.filter(filter).size;
        const filterFn = filter ? (u: User): boolean => u.id !== u.client.user?.id : () => true;

        return await this.broadcastEvalSize(`eval(${fn.toString()})(this, ${filterFn.toString()})`) ?? fn(this.client, filterFn);
    }

    public async getTotalPlaying(): Promise<number> {
        const fn = (client: Client): number => client.guilds.cache.filter(g => g.queue?.playing === true).size;

        return await this.broadcastEvalSize(`eval(${fn.toString()})(this)`) ?? fn(this.client);
    }

    public hastebin(text: string): Promise<string> {
        return new Promise((resolve, reject) => {
            const req = request({ hostname: "bin.zhycorp.net", path: "/documents", method: "POST", minVersion: "TLSv1.3" }, res => {
                let raw = "";
                res.on("data", chunk => raw += chunk);
                res.on("end", () => {
                    if (res.statusCode! >= 200 && res.statusCode! < 300) return resolve(`https://bin.zhycorp.net/${JSON.parse(raw).key as string}`);
                    return reject(new Error(`[hastebin] Error while trying to send data to https://bin.zhycorp.net/documents, ${res.statusCode as number} ${res.statusMessage as string}`));
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
        return this.client.user?.setPresence({
            activity: { name: activityName, type: this.client.config.status.type }
        }).catch(e => { this.client.logger.error("CLIENT_UPDATE_PRESENCE_ERR:", e); return undefined; });
    }

    private async broadcastEvalSize(script: string): Promise<number | undefined> {
        return (await this.client.shard?.broadcastEval(script))?.reduce((p, c) => p + c);
    }
}
