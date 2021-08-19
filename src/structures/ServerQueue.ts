import { SongManager } from "../utils/SongManager";
import { ISongs, ITextChannel } from "../../typings";
import { Snowflake, VoiceChannel, VoiceConnection } from "discord.js";

export class ServerQueue {
    public connection: VoiceConnection | null = null;
    public readonly songs: ISongs = new SongManager();
    public volume = 0;
    public loopMode: 0 | 1 | 2 = 0;
    public timeout: NodeJS.Timeout | null = null;
    public playing = false;
    public lastMusicMessageID: Snowflake | null = null;
    public lastVoiceStateUpdateMessageID: Snowflake | null = null;
    public constructor(public textChannel: ITextChannel | null = null, public voiceChannel: VoiceChannel | null = null) {
        this.volume = textChannel!.client.config.defaultVolume;
        Object.defineProperties(this, {
            timeout: {
                enumerable: false
            }
        });
    }
}
