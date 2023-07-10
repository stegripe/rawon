/* eslint-disable class-methods-use-this */
import { Rawon } from "../../structures/Rawon.js";
import { Guild, Role, ChannelType } from "discord.js";
import { execSync } from "node:child_process";
import { parse } from "node:path";
import prism from "prism-media";

const { FFmpeg } = prism;

export class ClientUtils {
    public constructor(public readonly client: Rawon) { }

    public async fetchMuteRole(guild: Guild): Promise<Role | null> {
        const id = this.client.data.data?.[guild.id]?.mute;
        return id ? guild.roles.fetch(id).catch(() => null) : null;
    }

    public async fetchDJRole(guild: Guild): Promise<Role | null> {
        const data = this.client.data.data?.[guild.id]?.dj;
        if (data?.enable && data.role) return guild.roles.fetch(data.role);

        return null;
    }

    public requiredVoters(memberAmount: number): number {
        return Math.round(memberAmount / 2);
    }

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
                (c, t) =>
                    c.channels.cache
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

    public async getPlayingCount(): Promise<number> {
        if (this.client.shard) {
            const playings = await this.client.shard.broadcastEval(
                c => c.guilds.cache.filter(x => x.queue?.playing === true).size
            );

            return playings.reduce((prev, curr) => prev + curr);
        }

        return this.client.guilds.cache.filter(x => x.queue?.playing === true).size;
    }

    public async import<T>(path: string, ...args: any[]): Promise<T | undefined> {
        const file = await import(path).then(
            m => (m as Record<string, (new (...argument: any[]) => T) | undefined>)[parse(path).name]
        );
        return file ? new file(...(args as unknown[])) : undefined;
    }

    public getFFmpegVersion(): string {
        try {
            const ffmpeg = FFmpeg.getInfo();
            return (
                ffmpeg.version
                    .split(/_|-| /)
                    .find(x => /[0-9.]/.test(x))
                    ?.replace(/[^0-9.]/g, "") ?? "Unknown"
            );
        } catch {
            return "Unknown";
        }
    }

    public getCommitHash(ref: string, short = true): string {
        try {
            const res = execSync(`git rev-parse${short ? " --short" : ""} ${ref}`);
            return res.toString().trim();
        } catch {
            return "???"
        }
    }
}
