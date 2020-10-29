import type { Message, Guild, TextChannel, VoiceChannel, DMChannel, NewsChannel, VoiceConnection, Collection, ClientEvents, VoiceState } from "discord.js";
import type Jukebox from "../src/structures/Jukebox";

export interface CommandComponent {
    conf: {
        aliases?: string[];
        cooldown?: number;
        disable?: boolean;
        path?: string;
    };
    help: {
        name: string;
        description?: string;
        usage?: string;
    };
    execute(message: Message, args: string[]): any;
}
export interface IGuild extends Guild {
    client: Jukebox;
    queue: IServerQueue | null;
}
export interface IMessage extends Message {
    client: Jukebox;
    guild: IGuild | null;
    channel: ITextChannel | INewsChannel | IDMChannel;
}
export interface ITextChannel extends TextChannel {
    client: Jukebox;
    guild: IGuild;
}
export interface INewsChannel extends NewsChannel {
    client: Jukebox;
    guild: IGuild;
}
export interface IDMChannel extends DMChannel {
    client: Jukebox;
    guild: null;
}

export interface IServerQueue {
    textChannel: ITextChannel | IDMChannel | INewsChannel | null;
    voiceChannel: VoiceChannel | null;
    connection: VoiceConnection | null;
    songs: ISongs;
    volume: number;
    playing: boolean;
    loopMode: 0 | 1 | 2;
    timeout: NodeJS.Timeout | null;
}
export interface ISongs extends Collection<string, ISong> {
    addSong(song: ISong): this;
    deleteFirst(): boolean;
}
export interface ISong {
    id: string;
    title: string;
    url: string;
}
export interface ClientEventListener {
    name: keyof ClientEvents;
    execute(...args: ClientEvents[EventProp["name"]]): any;
}
export interface IVoiceState extends VoiceState {
    guild: IGuild;
}
