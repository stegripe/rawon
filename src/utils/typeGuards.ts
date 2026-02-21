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

export interface FfmpegStreamWithEvents {
    stderr?: {
        on?(event: string, cb: (chunk: import("node:buffer").Buffer) => void): void;
    };
    on?(event: string, cb: (...args: unknown[]) => void): void;
}
