import type { ClientEventListener } from "../../typings";
import type Jukebox from "../structures/Disc_11";

export default class WarnEvent implements ClientEventListener {
    public readonly name = "warn";
    public constructor(private readonly client: Jukebox) {}

    public execute(warn: string): void {
        this.client.logger.warn("CLIENT_WARN:", warn);
    }
}
