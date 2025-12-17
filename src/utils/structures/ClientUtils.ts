import { Buffer } from "node:buffer";
import { execSync } from "node:child_process";
import nodePath from "node:path";
import process from "node:process";
import { ChannelType, type Guild, type Role } from "discord.js";
import prism from "prism-media";
import { type Rawon } from "../../structures/Rawon.js";

const { FFmpeg } = prism;

export class ClientUtils {
    public constructor(public readonly client: Rawon) {}

    public async fetchDJRole(guild: Guild): Promise<Role | null> {
        const data = this.client.data.data?.[guild.id]?.dj;
        if (data?.enable === true && (data.role?.length ?? 0) > 0) {
            return guild.roles.fetch(data.role ?? "");
        }

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
            const shardUsers = await this.client.shard.broadcastEval((c) =>
                c.users.cache.map((x) => x.id),
            );

            for (const users of shardUsers) {
                arr = [...arr, ...users];
            }
        } else {
            arr = this.client.users.cache.map((x) => x.id);
        }

        return arr.filter((x, i) => arr.indexOf(x) === i).length;
    }

    public async getChannelCount(textOnly = false, voiceOnly = false): Promise<number> {
        let arr: string[] = [];

        if (this.client.shard) {
            const shardChannels = await this.client.shard.broadcastEval(
                (c, ty) =>
                    c.channels.cache
                        .filter((ch) => {
                            if (ty.textOnly) {
                                return (
                                    ch.type === ty.types.GuildText ||
                                    ch.type === ty.types.PublicThread ||
                                    ch.type === ty.types.PrivateThread
                                );
                            }
                            if (ty.voiceOnly) {
                                return ch.type === ty.types.GuildVoice;
                            }

                            return true;
                        })
                        .map((ch) => ch.id),
                {
                    context: { textOnly, voiceOnly, types: ChannelType },
                },
            );

            for (const channels of shardChannels) {
                arr = [...arr, ...channels];
            }
        } else {
            arr = this.client.channels.cache
                .filter((ch) => {
                    if (textOnly) {
                        return (
                            ch.type === ChannelType.GuildText ||
                            ch.type === ChannelType.PublicThread ||
                            ch.type === ChannelType.PrivateThread
                        );
                    }
                    if (voiceOnly) {
                        return ch.type === ChannelType.GuildVoice;
                    }

                    return true;
                })
                .map((ch) => ch.id);
        }

        return arr.filter((x, i) => arr.indexOf(x) === i).length;
    }

    public async getGuildCount(): Promise<number> {
        if (this.client.shard) {
            const guilds = await this.client.shard.broadcastEval((c) => c.guilds.cache.size);

            return guilds.reduce((prev, curr) => prev + curr);
        }

        return this.client.guilds.cache.size;
    }

    public async getPlayingCount(): Promise<number> {
        if (this.client.shard) {
            const playings = await this.client.shard.broadcastEval(
                (c) => c.guilds.cache.filter((x) => x.queue?.playing === true).size,
            );

            return playings.reduce((prev, curr) => prev + curr);
        }

        return this.client.guilds.cache.filter((x) => x.queue?.playing === true).size;
    }

    public async import<T>(path: string, ...args: any[]): Promise<T | undefined> {
        const file = await import(path).then(
            (mod) =>
                (mod as Record<string, (new (...argument: any[]) => T) | undefined>)[
                    nodePath.parse(path).name
                ],
        );
        return file ? new file(...(args as unknown[])) : undefined;
    }

    public getFFmpegVersion(): string {
        try {
            const ffmpeg = FFmpeg.getInfo();
            return (
                ffmpeg.version
                    .split(/[ _-]/u)
                    .find((x) => /[\d.]/u.test(x))
                    ?.replaceAll(/[^\d.]/gu, "") ?? "Unknown"
            );
        } catch {
            return "Unknown";
        }
    }

    public getCommitHash(ref: string, short = true): string {
        const envCommit = process.env.GIT_COMMIT_HASH;
        if ((envCommit?.length ?? 0) > 0) {
            return short ? envCommit!.slice(0, 7) : envCommit!;
        }

        try {
            const res = execSync(`git rev-parse${short ? " --short" : ""} ${ref}`);
            return res.toString().trim();
        } catch {
            return "???";
        }
    }
}
