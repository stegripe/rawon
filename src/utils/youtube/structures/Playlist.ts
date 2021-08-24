import { Item, itemType } from "./Item";
import { Video } from "./Video";
import { Result as IPlaylist } from "ytpl";

export class Playlist extends Item {
    public itemCount: number;
    public constructor(public readonly raw: IPlaylist, protected readonly _type: itemType) {
        super(raw, _type);
        this.itemCount = raw.items.length;
    }

    public async getVideos(): Promise<Video[]> {
        return this.raw.items.map((i: any) => new Video(i, this._type));
    }
}
