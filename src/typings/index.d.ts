import { CommandContext } from "../structures/CommandContext";
import { ServerQueue } from "../structures/ServerQueue";
import { Disc } from "../structures/Disc";

import { ActivityType, ApplicationCommandOptionData, ApplicationCommandType, ClientEvents, ClientPresenceStatus, Client as OClient, Collection, GuildMember, MessageEmbed } from "discord.js";

export type MessageInteractionAction = "editReply" | "reply" | "followUp";

export interface QueryData {
    isURL: boolean;
    sourceType?: "youtube" | "spotify" | "soundcloud" | "query" | "unknown";
    type?: "track" | "playlist" | "unknown";
}

export interface SearchTrackResult {
    type?: "selection"|"results";
    items: ISong[];
}

export interface PaginationPayload {
    author: string;
    content?: string;
    pages: string[];
    embed: MessageEmbed;
    edit(index: number, embed: MessageEmbed, page: string): unknown;
}

export interface IDiscLoggerOptions {
    prod: boolean;
}

export interface SlashOption {
    name?: string;
    description?: string;
    type?: ApplicationCommandType;
    options?: ApplicationCommandOptionData[];
    defaultPermission?: boolean;
}

export interface IpresenceData {
    activities: { name: string; type: Exclude<ActivityType, "CUSTOM"> }[];
    status: ClientPresenceStatus[];
    interval: number;
}

export interface IEvent {
    readonly name: keyof ClientEvents;
    execute(...args: any): void;
}

export interface ICommandComponent {
    meta: {
        aliases?: string[];
        cooldown?: number;
        disable?: boolean;
        readonly path?: string;
        devOnly?: boolean;
        description?: string;
        readonly category?: string;
        name: string;
        usage?: string;
        slash?: SlashOption;
        contextChat?: string;
        contextUser?: string;
    };
    execute(context: CommandContext): any;
}

export interface ICategoryMeta {
    name: string;
    hide: boolean;
    cmds: Collection<string, ICommandComponent>;
}

declare module "discord.js" {
    // @ts-expect-error Override typings
    export interface Client extends OClient {
        config: Disc["config"];
        logger: Disc["logger"];
        request: Disc["request"];
        commands: Disc["commands"];
        events: Disc["events"];

        build(token: string): Promise<this>;
    }

    export interface Guild {
        client: Disc;
        queue?: ServerQueue;
    }
}

export interface ISong {
    id: string;
    title: string;
    url: string;
    duration: number;
    thumbnail: string;
}

export interface IQueueSong {
    song: ISong;
    requester: GuildMember;
    index: number;
    key: string;
}

export type LoopMode = "OFF"|"SONG"|"QUEUE";

export interface ILyricsAPIResult<E extends boolean> {
    error: E;
    artist?: E extends true ? null : string;
    song?: E extends true ? null : string;
    album_art?: E extends true ? null : string;
    lyrics?: E extends true ? null : string;
    url?: E extends true ? null : string;
    message?: E extends true ? string : never;
    synced: E extends true ? never : boolean|string;
}

export interface ISpotifyAccessTokenAPIResult {
    clientId: string;
    accessToken?: string;
    accessTokenExpirationTimestampMs: number;
    isAnonymous: boolean;
}

export interface ExternalUrls {
    spotify: string;
}

export interface ArtistsEntity {
    external_urls: ExternalUrls;
    href: string;
    id: string;
    name: string;
    type: string;
    uri: string;
}

export interface SpotifyArtist {
    name: string;
}

export interface SpotifyPlaylist {
    name: string;
    tracks: {
        items: { track: SpotifyTrack }[];
        next: string | null;
        previous: string | null;
    };
}

export interface SpotifyTrack {
    artists: ArtistsEntity[];
    duration_ms: number;
    external_urls: {
        spotify: string;
    };
    id: string;
    name: string;
}

export interface SpotifyArtist {
    tracks: SpotifyTrack[];
}
