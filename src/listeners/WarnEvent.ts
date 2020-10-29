import type { ClientEventListener } from "../../typings";
import type Disc_11 from "../structures/Disc_11";

export default class WarnEvent implements ClientEventListener {
    public readonly name = "warn";
    public constructor(private readonly client: Disc_11) {}

    public execute(warn: string): void {
        this.client.logger.warn("CLIENT_WARN:", warn);
    }
}
