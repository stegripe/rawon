import { ActivityOptions, ApplicationCommandOptionData, ApplicationCommandType, ClientEvents, Guild } from "discord.js";

export type MessageInteractionAction = "editReply" | "followUp" | "reply";

export interface SlashOption {
    options?: ApplicationCommandOptionData[];
    type?: ApplicationCommandType;
    defaultPermission?: boolean;
    description?: string;
    name?: string;
}

export type EnvActivityTypes = "Competing" | "Listening" | "Playing" | "Watching";

export interface PresenceData {
    activities: ActivityOptions[];
    status: ClientPresenceStatus[];
    interval: number;
}

export interface Event<T extends keyof ClientEvents = keyof ClientEvents> {
    readonly name: T;
    execute: (...args: ClientEvents[T]) => Promise<void>;
}

export interface CommandComponent {
    execute: (ctx: CommandContext) => any;
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

export interface CategoryMeta {
    cmds: string[];
    hide: boolean;
    name: string;
}

export interface Module {
    name: string;
    description: string;
    path: string;
    enabled: boolean;
}

export type NonAbstractConstructor<R = unknown> = new (...args: any[]) => R;
export type Constructor<R = unknown> = NonAbstractConstructor<R> | (abstract new (...args: any[]) => R);

export type MethodDecorator<T, R> = (
    target: T,
    propertyKey: string,
    descriptor: PropertyDescriptor
) => R;
export type ClassDecorator<T extends Constructor, R = unknown> = (target: T) => R;
export type Promisable<O> = O | Promise<O>;
export type FunctionType<A extends any[] = any[], R = any> = (...args: A) => R;

// eslint-disable-next-line
export type RegisterCmdOptions<T = false> = (T extends true ? { guild?: Guild } : {}) & {
    onRegistered: (guild: Guild | null, type: "message" | "slash" | "user") => void;
    onError: (guild: Guild | null, error: Error, type: "message" | "slash" | "user") => void;
};

declare global {
    type Promisable<T> = Promise<T> | T;
    type FunctionType<Args extends any[] = any[], Result = any> = (...args: Args) => Result;
}
