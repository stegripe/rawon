import { Song, QueueSong } from "../../typings/index.js";
import { Rawon } from "../../structures/Rawon.js";
import { Collection, GuildMember, Snowflake, SnowflakeUtil } from "discord.js";

export class SongManager extends Collection<Snowflake, QueueSong> {
    private id = 0;

    public constructor(public readonly client: Rawon, public readonly guild: GuildMember["guild"]) {
        super();
    }

    public addSong(song: Song, requester: GuildMember): Snowflake {
        const key = SnowflakeUtil.generate().toLocaleString();
        const data: QueueSong = {
            index: this.id++,
            key,
            requester,
            song
        };

        this.set(key, data);
        return key;
    }

    public set(key: Snowflake, data: QueueSong): this {
        (this.client as Rawon | undefined)?.debugLog.logData(
            "info",
            "SONG_MANAGER",
            `New value added to ${this.guild.name}(${this.guild.id}) song manager. Key: ${key}`
        );
        return super.set(key, data);
    }

    public delete(key: Snowflake): boolean {
        (this.client as Rawon | undefined)?.debugLog.logData(
            "info",
            "SONG_MANAGER",
            `Value ${key} deleted from ${this.guild.name}(${this.guild.id}) song manager.`
        );
        return super.delete(key);
    }

    public sortByIndex(): this {
        return this.sort((a, b) => a.index - b.index);
    }
}
