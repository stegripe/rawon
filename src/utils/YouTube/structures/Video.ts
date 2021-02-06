import { Video as APIVideo } from "../utils/YouTubeAPI/structures/Video";
import { Item } from "./Item";
import parse from "parse-ms";

export class Video extends Item {
    public channel: APIVideo["channel"];
    public duration: parse.Parsed | null;
    public isPrivate: boolean;
    public constructor(protected readonly rawData: APIVideo) {
        super(rawData);
        this.channel = rawData.channel;
        this.duration = rawData.durationMS ? parse(rawData.durationMS) : null;
        this.isPrivate = rawData.status.privacyStatus === "private";
    }
}
