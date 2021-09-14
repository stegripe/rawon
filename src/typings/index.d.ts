import { CommandContext } from "../structures/CommandContext";
import { BotClient } from "../structures/BotClient";
import { ApplicationCommandData, ApplicationCommandOptionData, ClientEvents, Client as OClient, Collection, Guild as EGuild, MessageEmbed } from "discord.js";

export type MessageInteractionAction = "editReply" | "reply" | "followUp";

export interface PaginationPayload {
    content?: string;
    pages: string[];
    embed: MessageEmbed;
    edit(index: number, embed: MessageEmbed, page: string): unknown;
}

export interface SlashOption extends ApplicationCommandData {
    name?: string;
    description?: string;
    options?: ApplicationCommandOptionData[];
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
    execute(context: CommandContext, ...args: any): any;
}

export interface ICategoryMeta {
    name: string;
    hide: boolean;
    cmds: Collection<string, ICommandComponent>;
}

declare module "discord.js" {
    // @ts-expect-error Override typings
    export interface Client extends OClient {
        config: BotClient["config"];
        logger: BotClient["logger"];
        request: BotClient["request"];
        commands: BotClient["commands"];
        events: BotClient["events"];

        build(token: string): Promise<this>;
    }

    export interface Guild extends EGuild {
        client: BotClient;
    }
}
