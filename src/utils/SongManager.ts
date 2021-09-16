import { ISong, IQueueSong } from "../typings";
import { Collection, Snowflake, SnowflakeUtil } from "discord.js";

export class SongManager extends Collection<Snowflake, IQueueSong> {
    public addSong(song: ISong): Snowflake {
        const firstIndex = this.sort((a, b) => b.index - a.index).first()?.index;
        const data: IQueueSong = {
            index: firstIndex ? firstIndex + 1 : 0,
            song
        };
        const key = SnowflakeUtil.generate();

        this.set(key, data);
        return key;
    }
}
