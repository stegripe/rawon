import { Song, QueueSong } from "../../typings";
import { Collection, GuildMember, Snowflake, SnowflakeUtil } from "discord.js";

export class SongManager extends Collection<Snowflake, QueueSong> {
    public addSong(song: Song, requester: GuildMember): Snowflake {
        const key = SnowflakeUtil.generate();
        const data: QueueSong = {
            index: Date.now(),
            key,
            requester,
            song
        };

        this.set(key, data);
        return key;
    }

    public sortByIndex(): this {
        return this.sort((a, b) => a.index - b.index);
    }
}
