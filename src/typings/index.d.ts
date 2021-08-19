import { ServerQueue } from "../structures/ServerQueue";
import { Disc } from "../structures/Disc";
import { Client as OClient, ClientEvents, Guild as OGuild } from "discord.js";

export interface ICommandComponent {
    meta: {
        aliases?: string[];
        cooldown?: number;
        disable?: boolean;
        path?: string;
        name: string;
        description?: string;
        usage?: string;
    };
    execute(message: IMessage, args: string[]): any;
}
export interface IEvent {
    name: keyof ClientEvents;
    execute(...args: any): any;
}
declare module "discord.js" {
    export interface Client extends OClient {
        public readonly config: Disc["config"];
        public readonly logger: Disc["logger"];
        public readonly commands: Disc["commands"];
        public readonly events: Jukebox["events"];
        public readonly youtube: Disc["youtube"];

        public async build(token: string): Promise<this>;
        public async getGuildsCount(): Promise<number>;
        public async getChannelsCount(filter = true): Promise<number>;
        public async getUsersCount(filter = true): Promise<number>;
        public async getTotalPlaying(): Promise<number>;
        public async getTotalMemory(type: keyof NodeJS.MemoryUsage): Promise<number>;
    }
    export interface Guild extends OGuild {
        queue: ServerQueue | null;
    }
}
export interface ISong {
    id: string;
    title: string;
    url: string;
    thumbnail: string;
}
