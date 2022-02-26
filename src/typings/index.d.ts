/* eslint-disable @typescript-eslint/naming-convention */
import { CommandContext } from "../structures/CommandContext";
import { ServerQueue } from "../structures/ServerQueue";
import { Rawon } from "../structures/Rawon";
import { ActivityType, ApplicationCommandOptionData, ApplicationCommandType, ClientEvents, ClientPresenceStatus, Client as OClient, Collection, GuildMember, MessageEmbed } from "discord.js";

export type MessageInteractionAction = "editReply" | "followUp" | "reply";

export interface QueryData {
    sourceType?: "query" | "soundcloud" | "spotify" | "unknown" | "youtube";
    type?: "playlist" | "track" | "unknown";
    isURL: boolean;
}

export interface basicYoutubeVideoInfo {
    thumbnails: { url: string; width: number; height: number }[];
    duration: number;
    title: string;
    url: string;
    id: string;
}

export interface SearchTrackResult {
    type?: "results" | "selection";
    items: ISong[];
}

export interface PaginationPayload {
    edit: (index: number, embed: MessageEmbed, page: string) => unknown;
    embed: MessageEmbed;
    content?: string;
    pages: string[];
    author: string;
}

export interface IRawonLoggerOptions {
    prod: boolean;
}

export interface SlashOption {
    options?: ApplicationCommandOptionData[];
    type?: ApplicationCommandType;
    defaultPermission?: boolean;
    description?: string;
    name?: string;
}

export interface IpresenceData {
    activities: { name: string; type: Exclude<ActivityType, "CUSTOM"> }[];
    status: ClientPresenceStatus[];
    interval: number;
}

export interface IEvent {
    readonly name: keyof ClientEvents;
    execute: (...args: any) => void;
}

export interface ICommandComponent {
    execute: (context: CommandContext) => any;
    meta: {
        readonly category?: string;
        readonly path?: string;
        contextChat?: string;
        contextUser?: string;
        description?: string;
        slash?: SlashOption;
        aliases?: string[];
        cooldown?: number;
        disable?: boolean;
        devOnly?: boolean;
        usage?: string;
        name: string;
    };
}

export interface ICategoryMeta {
    cmds: Collection<string, ICommandComponent>;
    hide: boolean;
    name: string;
}

declare module "discord.js" {
    // @ts-expect-error Override typings
    export interface Client extends OClient {
        commands: Rawon["commands"];
        request: Rawon["request"];
        config: Rawon["config"];
        logger: Rawon["logger"];
        events: Rawon["events"];

        build: () => Promise<this>;
    }

    export interface Guild {
        queue?: ServerQueue;
        client: Rawon;
    }
}

export interface ISong {
    thumbnail: string;
    duration: number;
    title: string;
    url: string;
    id: string;
}

export interface IQueueSong {
    requester: GuildMember;
    index: number;
    song: ISong;
    key: string;
}

export type LoopMode = "OFF" | "QUEUE" | "SONG";

export interface ILyricsAPIResult<E extends boolean> {
    synced: E extends true ? never : boolean | string;
    album_art?: E extends true ? null : string;
    message?: E extends true ? string : never;
    artist?: E extends true ? null : string;
    lyrics?: E extends true ? null : string;
    song?: E extends true ? null : string;
    url?: E extends true ? null : string;
    error: E;
}

export interface ISpotifyAccessTokenAPIResult {
    accessTokenExpirationTimestampMs: number;
    accessToken?: string;
    isAnonymous: boolean;
    clientId: string;
}

export interface ExternalUrls {
    spotify: string;
}

export interface ArtistsEntity {
    external_urls: ExternalUrls;
    href: string;
    name: string;
    type: string;
    uri: string;
    id: string;
}

export interface SpotifyArtist {
    name: string;
}

export interface SpotifyPlaylist {
    name: string;
    tracks: {
        items: { track: SpotifyTrack }[];
        previous: string | null;
        next: string | null;
    };
}

export interface SpotifyTrack {
    artists: ArtistsEntity[];
    duration_ms: number;
    external_urls: {
        spotify: string;
    };
    name: string;
    id: string;
}

export interface SpotifyArtist {
    tracks: SpotifyTrack[];
}

export interface GuildData {
    infractions: Record<string, {
        on: number;
        reason: string | null;
    }[]>;
    modLog: {
        enable: boolean;
        channel: string | null;
    };
}

export type NonAbstractConstructor<Result = unknown> = new (...args: any[]) => Result;
export type Constructor<Result = unknown> =
    | NonAbstractConstructor<Result>
    | (abstract new (...args: any[]) => Result);

export type MethodDecorator<Target, Result> = (
    target: Target,
    propertyKey: string,
    descriptor: PropertyDescriptor) => Result;
export type ClassDecorator<Target extends Constructor, Result = unknown> = (target: Target) => Result;
export type Promisable<Output> = Output | Promise<Output>;
export type FunctionType<Args extends any[] = any[], Result = any> = (...args: Args) => Result;
