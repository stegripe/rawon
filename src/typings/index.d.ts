import {
    type ApplicationCommandOptionData,
    type ApplicationCommandType,
    type Client as OClient,
    type ClientEvents,
    type ClientPresenceStatus,
    type Collection,
    type Guild as OG,
    type GuildMember,
    type EmbedBuilder,
} from "discord.js";
import { type Got } from "got";
import { type Soundcloud } from "soundcloud.ts";
import { type CommandContext } from "../structures/CommandContext.js";
import { type Rawon } from "../structures/Rawon.js";
import { type ServerQueue } from "../structures/ServerQueue.js";
import { type SpotifyUtil } from "../utils/handlers/SpotifyUtil.js";
import { type AudioCacheManager } from "../utils/structures/AudioCacheManager.js";
import { type ClientUtils } from "../utils/structures/ClientUtils.js";
import { type CookiesManager } from "../utils/structures/CookiesManager.js";
import { type DebugLogManager } from "../utils/structures/DebugLogManager.js";
import { type RequestChannelManager } from "../utils/structures/RequestChannelManager.js";
import { type SQLiteDataManager } from "../utils/structures/SQLiteDataManager.js";
import type * as config from "../config/index.js";

export type MessageInteractionAction = "editReply" | "followUp" | "reply";

export type QueryData = {
    sourceType?: "query" | "soundcloud" | "spotify" | "unknown" | "youtube";
    type?: "artist" | "playlist" | "track" | "unknown";
    isURL: boolean;
};

export type BasicYoutubeVideoInfo = {
    thumbnails?: { url: string; width: number; height: number }[];
    duration: number;
    title: string;
    url: string;
    id: string;
    is_live?: boolean;
};

export type PlaylistMetadata = {
    title: string;
    url: string;
    thumbnail?: string;
    author?: string;
};

export type SearchTrackResult = {
    type?: "results" | "selection";
    items: Song[];
    playlist?: PlaylistMetadata;
};

export type PaginationPayload = {
    edit(index: number, embed: EmbedBuilder, page: string): unknown;
    embed: EmbedBuilder;
    content?: string;
    pages: string[];
    author: string;
};

export type SlashOption = {
    options?: ApplicationCommandOptionData[];
    type?: ApplicationCommandType;
    defaultPermission?: boolean;
    description?: string;
    name?: string;
};

export type EnvActivityTypes = "Competing" | "Listening" | "Playing" | "Watching";

export type PresenceData = {
    activities: { name: string; type: EnvActivityTypes }[];
    status: ClientPresenceStatus[];
    interval: number;
};

export type Event = {
    readonly name: keyof ClientEvents;
    execute(...args: any): void;
};

export type CommandComponent = {
    execute(context: CommandContext): any;
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
};

export type CategoryMeta = {
    cmds: Collection<string, CommandComponent>;
    hide: boolean;
    name: string;
};

declare module "@sapphire/framework" {
    interface CommandOptions {
        devOnly?: boolean;
        cooldown?: number;
        contextChat?: string;
        contextUser?: string;
        disable?: boolean;
    }
}

export type CommandMeta = {
    name: string;
    description?: string;
    aliases?: readonly string[];
    cooldown?: number;
    devOnly?: boolean;
    contextChat?: string;
    contextUser?: string;
    disable?: boolean;
    slash?: boolean;
};

declare module "discord.js" {
    export interface Client extends OClient {
        commands: Rawon["commands"];
        request: Rawon["request"];
        config: Rawon["config"];
        logger: Rawon["logger"];
        events: Rawon["events"];

        build(): Promise<this>;
    }

    export interface Guild extends OG {
        queue?: ServerQueue;
        client: Rawon;
    }
}

export type Song = {
    thumbnail: string;
    duration: number;
    title: string;
    url: string;
    id: string;
    isLive?: boolean;
};

export type QueueSong = {
    requester: GuildMember;
    index: number;
    song: Song;
    key: string;
};

export type SavedQueueSong = {
    requesterId: string;
    index: number;
    song: Song;
    key: string;
};

export type LoopMode = "OFF" | "QUEUE" | "SONG";

export type LyricsAPIResult<E extends boolean> = {
    synced: E extends true ? never : boolean | string;
    album_art?: E extends true ? null : string;
    message?: E extends true ? string : never;
    artist?: E extends true ? null : string;
    lyrics?: E extends true ? null : string;
    song?: E extends true ? null : string;
    url?: E extends true ? null : string;
    error: E;
};

export type SpotifyAccessTokenAPIResult = {
    accessTokenExpirationTimestampMs: number;
    accessToken?: string;
    isAnonymous: boolean;
    clientId: string;
};

export type ExternalUrls = {
    spotify: string;
};

export type ArtistsEntity = {
    external_urls: ExternalUrls;
    href: string;
    name: string;
    type: string;
    uri: string;
    id: string;
};

export type SpotifyArtist = {
    name: string;
    tracks: SpotifyTrack[];
};

type SpotifyData<T> = {
    name: string;
    tracks: {
        items: T[];
        previous: string | null;
        next: string | null;
    };
};

export type SpotifyAlbum = SpotifyData<SpotifyTrack> & {
    external_urls: {
        spotify: string;
    };
    images?: { url: string; height: number; width: number }[];
    artists?: ArtistsEntity[];
};

export type SpotifyPlaylist = SpotifyData<{ track: SpotifyTrack }> & {
    external_urls: {
        spotify: string;
    };
    images?: { url: string; height: number; width: number }[];
    owner?: {
        display_name: string;
    };
};

export type SpotifyTrack = {
    artists: ArtistsEntity[];
    duration_ms: number;
    external_ids?: {
        isrc: string;
    };
    external_urls: {
        spotify: string;
    };
    name: string;
    id: string;
};

export type SpotifyResolveResult = {
    tracks: { track: SpotifyTrack }[];
    metadata?: PlaylistMetadata;
};

export type BotSettings = {
    embedColor: string;
    yesEmoji: string;
    noEmoji: string;
    altPrefix: string[];
    requestChannelSplash: string;
    defaultVolume: number;
    musicSelectionType: string;
    enableAudioCache: boolean;
};

export type GuildData = {
    dj?: {
        enable: boolean;
        role: string | null;
    };
    requestChannel?: {
        channelId: string | null;
        messageId: string | null;
    };
    playerState?: {
        loopMode: LoopMode;
        shuffle: boolean;
        volume: number;
        filters: Record<string, boolean>;
    };
    queueState?: {
        textChannelId: string;
        voiceChannelId: string;
        songs: SavedQueueSong[];
        currentSongKey: string | null;
        currentPosition: number;
    };
    locale?: string;
    prefix?: string;
};

export type NonAbstractConstructor<Result = unknown> = new (...args: any[]) => Result;
export type Constructor<Result = unknown> =
    | NonAbstractConstructor<Result>
    | (abstract new (
          ...args: any[]
      ) => Result);

export type MethodDecorator<Target, Result> = (
    target: Target,
    propertyKey: string,
    descriptor: PropertyDescriptor,
) => Result;
export type ClassDecorator<Target extends Constructor, Result = unknown> = (
    target: Target,
) => Result;
export type Promisable<Output> = Output | Promise<Output>;
export type FunctionType<Args extends any[] = any[], Result = any> = (...args: Args) => Result;

export type RegisterCmdOptions = {
    onRegistered(guild: OG): Promisable<any>;
    onError(guild: OG | null, error: Error): Promisable<any>;
};

export interface ExtendedDataManager {
    getAllGuildIds(): string[];
    deleteRequestChannel(guildId: string, botId: string): Promise<void>;
    deletePlayerState(guildId: string, botId: string): Promise<void>;
    deleteQueueState(guildId: string, botId: string): Promise<void>;
    deleteGuildData(guildId: string): Promise<void>;
    getRequestChannel(
        guildId: string,
        botId: string,
    ): { channelId: string | null; messageId: string | null } | null;
}

declare module "@sapphire/framework" {
    interface Container {
        config: typeof config;
        data: SQLiteDataManager<Record<string, GuildData>>;
        debugLog: DebugLogManager;
        spotify: SpotifyUtil;
        utils: ClientUtils;
        soundcloud: Soundcloud;
        requestChannelManager: RequestChannelManager;
        audioCache: AudioCacheManager;
        cookies: CookiesManager;
        request: Got;
    }
}
