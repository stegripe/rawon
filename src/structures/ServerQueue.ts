/* eslint-disable no-underscore-dangle, @typescript-eslint/unbound-method */
import { SongManager } from "../utils/SongManager";
import { ISongs, ITextChannel } from "../../typings";
import { Snowflake, VoiceChannel, VoiceConnection } from "discord.js";

export class ServerQueue {
    public connection: VoiceConnection | null = null;
    public readonly songs: ISongs = new SongManager();
    public volume = 0;
    public playing = false;
    public loopMode: 0 | 1 | 2 = 0;
    public timeout: NodeJS.Timeout | null = null;
    private _lastMusicMessageID: Snowflake | null = null;
    private _lastvoiceStateUpdateMessageID: Snowflake | null = null;
    public constructor(public textChannel: ITextChannel | null = null, public voiceChannel: VoiceChannel | null = null) {
        this.volume = textChannel!.client.config.defaultVolume;
        Object.defineProperty(this, "_lastMusicMessageID", {
            enumerable: false
        });
    }

    public get lastMusicMessageID(): Snowflake | null {
        return this._lastMusicMessageID;
    }

    public set lastMusicMessageID(id: Snowflake | null) {
        this._lastMusicMessageID = id;
    }

    public get lastVoiceStateUpdateMessageID(): Snowflake | null {
        return this._lastvoiceStateUpdateMessageID;
    }

    public set lastVoiceStateUpdateMessageID(id: Snowflake | null) {
        this._lastvoiceStateUpdateMessageID = id;
    }
}
