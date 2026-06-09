import { type ExtendedDataManager, type GuildData } from "../typings/index.js";

export type FallbackDataManager = {
    data?: Record<string, GuildData> | null;
    save?: (fn: () => Record<string, GuildData>) => Promise<unknown>;
    load?: () => Promise<unknown>;
};

export function hasGetRequestChannel(
    data: unknown,
): data is Pick<ExtendedDataManager, "getRequestChannel"> {
    return (
        typeof data === "object" &&
        data !== null &&
        "getRequestChannel" in data &&
        typeof (data as ExtendedDataManager).getRequestChannel === "function"
    );
}

export function hasSaveRequestChannel(
    data: unknown,
): data is Pick<ExtendedDataManager, "saveRequestChannel"> {
    return (
        typeof data === "object" &&
        data !== null &&
        "saveRequestChannel" in data &&
        typeof (data as ExtendedDataManager).saveRequestChannel === "function"
    );
}

export function hasGetPlayerState(
    data: unknown,
): data is Pick<ExtendedDataManager, "getPlayerState"> {
    return (
        typeof data === "object" &&
        data !== null &&
        "getPlayerState" in data &&
        typeof (data as ExtendedDataManager).getPlayerState === "function"
    );
}

export function hasSavePlayerState(
    data: unknown,
): data is Pick<ExtendedDataManager, "savePlayerState"> {
    return (
        typeof data === "object" &&
        data !== null &&
        "savePlayerState" in data &&
        typeof (data as ExtendedDataManager).savePlayerState === "function"
    );
}

export function hasSaveQueueState(
    data: unknown,
): data is Pick<ExtendedDataManager, "saveQueueState"> {
    return (
        typeof data === "object" &&
        data !== null &&
        "saveQueueState" in data &&
        typeof (data as ExtendedDataManager).saveQueueState === "function"
    );
}

export function hasGetVoiceChannelStatusState(
    data: unknown,
): data is Pick<ExtendedDataManager, "getVoiceChannelStatusState"> {
    return (
        typeof data === "object" &&
        data !== null &&
        "getVoiceChannelStatusState" in data &&
        typeof (data as ExtendedDataManager).getVoiceChannelStatusState === "function"
    );
}

export function hasGetVoiceChannelStatusStatesByChannel(
    data: unknown,
): data is Pick<ExtendedDataManager, "getVoiceChannelStatusStatesByChannel"> {
    return (
        typeof data === "object" &&
        data !== null &&
        "getVoiceChannelStatusStatesByChannel" in data &&
        typeof (data as ExtendedDataManager).getVoiceChannelStatusStatesByChannel === "function"
    );
}

export function hasSaveVoiceChannelStatusState(
    data: unknown,
): data is Pick<ExtendedDataManager, "saveVoiceChannelStatusState"> {
    return (
        typeof data === "object" &&
        data !== null &&
        "saveVoiceChannelStatusState" in data &&
        typeof (data as ExtendedDataManager).saveVoiceChannelStatusState === "function"
    );
}

export function hasDeleteVoiceChannelStatusState(
    data: unknown,
): data is Pick<ExtendedDataManager, "deleteVoiceChannelStatusState"> {
    return (
        typeof data === "object" &&
        data !== null &&
        "deleteVoiceChannelStatusState" in data &&
        typeof (data as ExtendedDataManager).deleteVoiceChannelStatusState === "function"
    );
}

export function hasDeleteQueueState(
    data: unknown,
): data is Pick<ExtendedDataManager, "deleteQueueState"> {
    return (
        typeof data === "object" &&
        data !== null &&
        "deleteQueueState" in data &&
        typeof (data as ExtendedDataManager).deleteQueueState === "function"
    );
}

export function hasDeletePlayerState(
    data: unknown,
): data is Pick<ExtendedDataManager, "deletePlayerState"> {
    return (
        typeof data === "object" &&
        data !== null &&
        "deletePlayerState" in data &&
        typeof (data as ExtendedDataManager).deletePlayerState === "function"
    );
}

export function isErrnoException(e: unknown): e is NodeJS.ErrnoException {
    return (
        typeof e === "object" &&
        e !== null &&
        "code" in e &&
        (typeof (e as NodeJS.ErrnoException).code === "string" ||
            typeof (e as NodeJS.ErrnoException).code === "number")
    );
}

export function hasGetQueueState(
    data: unknown,
): data is { getQueueState(guildId: string, botId: string): unknown } {
    return (
        typeof data === "object" &&
        data !== null &&
        "getQueueState" in data &&
        typeof (data as { getQueueState: unknown }).getQueueState === "function"
    );
}

export function hasGetGuildIdsWithQueueState(
    data: unknown,
): data is { getGuildIdsWithQueueState(botId: string): string[] } {
    return (
        typeof data === "object" &&
        data !== null &&
        "getGuildIdsWithQueueState" in data &&
        typeof (data as { getGuildIdsWithQueueState: unknown }).getGuildIdsWithQueueState ===
            "function"
    );
}

export interface FfmpegStreamWithEvents {
    stderr?: {
        on?(event: string, cb: (chunk: import("node:buffer").Buffer) => void): void;
    };
    on?(event: string, cb: (...args: unknown[]) => void): void;
}
