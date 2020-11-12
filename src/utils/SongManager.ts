import { Snowflake, Collection, SnowflakeUtil } from "discord.js";
import { ISongs as ISongManager, ISong } from "../../typings";

export class SongManager extends Collection<Snowflake, ISong> implements ISongManager {
    public constructor(data?: ReadonlyArray<readonly [Snowflake, ISong]> | null) {
        super(data);
    }

    public addSong(song: ISong): this {
        return this.set(SnowflakeUtil.generate(), song);
    }

    public deleteFirst(): boolean {
        return this.delete(this.firstKey()!);
    }

    public clear(): this {
        this.forEach((v: ISong, k: Snowflake) => {
            this.delete(k);
        });
        return this;
    }
}
