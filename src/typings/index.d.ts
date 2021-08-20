import { ServerQueue } from "../structures/ServerQueue";
import { Disc } from "../structures/Disc";
import { Client as OClient, ClientEvents, Guild as OGuild, Message } from "discord.js";
import { Readable } from "stream";

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
    execute(message: Message, args: string[]): any;
}
export interface IEvent {
    name: keyof ClientEvents;
    execute(...args: any): any;
}
declare module "discord.js" {
    // @ts-expect-error Override
    export interface Client extends OClient {
        readonly config: Disc["config"];
        readonly logger: Disc["logger"];
        readonly commands: Disc["commands"];
        readonly events: Disc["events"];
        readonly util: Disc["util"];
        readonly queue: Disc["queue"];

        build(token: string): Promise<this>;
    }
    // @ts-expect-error Override
    export interface Guild extends OGuild {
        queue: ServerQueue | null;
    }
}
export interface ISong {
    id: string;
    title: string;
    url: string;
    thumbnail: string;
    download(): Readable;
}
