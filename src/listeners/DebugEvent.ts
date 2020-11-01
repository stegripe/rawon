import type { ClientEventListener } from "../../typings";
import type Disc_11 from "../structures/Disc_11";

export default class DebugEvent implements ClientEventListener {
    public readonly name = "debug";
    public constructor(private readonly client: Disc_11) {}

    public execute(message: string): void {
        this.client.logger.debug(message);
    }
}
