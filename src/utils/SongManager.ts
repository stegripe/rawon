import type { Snowflake } from "discord.js";
import { Collection, SnowflakeUtil } from "discord.js";
import type { ISongs as ISongManager, ISong } from "../../typings";

export default class SongManager extends Collection<Snowflake, ISong> implements ISongManager {
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
