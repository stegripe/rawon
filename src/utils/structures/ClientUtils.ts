/* eslint-disable class-methods-use-this */
import { Rawon } from "../../structures/Rawon.js";
import { pathToFileURL } from "node:url";
import { parse } from "node:path";
import { readdirSync } from "node:fs";
import { ChannelType } from "discord.js";

export class ClientUtils {
    public constructor(public readonly client: Rawon) {}

    public decode(string: string): string {
        return Buffer.from(string, "base64").toString("ascii");
    }

    public async getUserCount(): Promise<number> {
        let arr: string[] = [];

        if (this.client.shard) {
            const shardUsers = await this.client.shard.broadcastEval(c => c.users.cache.map(x => x.id));

            for (const users of shardUsers) {
                arr = arr.concat(users);
            }
        } else {
            arr = this.client.users.cache.map(x => x.id);
        }

        return arr.filter((x, i) => arr.indexOf(x) === i).length;
    }

    public async getChannelCount(textOnly = false, voiceOnly = false): Promise<number> {
        let arr: string[] = [];

        if (this.client.shard) {
            const shardChannels = await this.client.shard.broadcastEval(
                (c, t) => c.channels.cache
                    .filter(ch => {
                        if (t.textOnly) {
                            return (
                                ch.type === t.types.GuildText ||
                                ch.type === t.types.PublicThread ||
                                ch.type === t.types.PrivateThread
                            );
                        } else if (t.voiceOnly) {
                            return ch.type === t.types.GuildVoice;
                        }

                        return true;
                    })
                    .map(ch => ch.id),
                {
                    context: { textOnly, voiceOnly, types: ChannelType }
                }
            );

            for (const channels of shardChannels) {
                arr = arr.concat(channels);
            }
        } else {
            arr = this.client.channels.cache
                .filter(ch => {
                    if (textOnly) {
                        return (
                            ch.type === ChannelType.GuildText ||
                            ch.type === ChannelType.PublicThread ||
                            ch.type === ChannelType.PrivateThread
                        );
                    } else if (voiceOnly) {
                        return ch.type === ChannelType.GuildVoice;
                    }

                    return true;
                })
                .map(ch => ch.id);
        }

        return arr.filter((x, i) => arr.indexOf(x) === i).length;
    }

    public async getGuildCount(): Promise<number> {
        if (this.client.shard) {
            const guilds = await this.client.shard.broadcastEval(c => c.guilds.cache.size);

            return guilds.reduce((prev, curr) => prev + curr);
        }

        return this.client.guilds.cache.size;
    }

    public async importFile<T>(path: string): Promise<T> {
        return import(pathToFileURL(path).toString());
    }

    public async importClass<T>(path: string, ...args: any[]): Promise<T | undefined> {
        const file = await this.importFile<Record<string, (new (...argument: any[]) => T) | undefined>>(path);
        const name = parse(path).name;
        return file[name] ? new file[name]!(...args as unknown[]) : undefined;
    }

    public readDir(dir: string): string[] {
        return readdirSync(dir);
    }
}
