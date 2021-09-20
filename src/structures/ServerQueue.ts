import { SongManager } from "../utils/SongManager";
import { LoopMode } from "../typings";
import { AudioPlayer, AudioPlayerStatus, VoiceConnection } from "@discordjs/voice";
import { TextBasedChannels, Snowflake } from "discord.js";

export class ServerQueue {
    public loopMode: LoopMode = "OFF";
    public shuffle = false;
    public connection: VoiceConnection|null = null;
    public player: AudioPlayer|null = null;
    public readonly songs = new SongManager();
    private _lastMusicMsg: Snowflake|null = null;

    public constructor(public readonly textChannel: TextBasedChannels) {
        Object.defineProperties(this, {
            _lastMusicMsg: {
                enumerable: false
            }
        });
    }

    public set lastMusicMsg(value: Snowflake|null) {
        this._lastMusicMsg = value;
    }

    public get lastMusicMsg(): Snowflake|null {
        return this._lastMusicMsg;
    }

    public set playing(value: boolean) {
        if (value) {
            this.player?.pause();
        } else {
            this.player?.unpause();
        }
    }

    public get playing(): boolean {
        return this.player?.state.status === AudioPlayerStatus.Playing;
    }
}
