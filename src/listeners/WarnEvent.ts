import type { ClientEventListener } from "../../typings";
import type Disc_11 from "../structures/Disc_11";
import { DefineListener } from "../utils/decorators/DefineListener";

@DefineListener("warn")
export default class WarnEvent implements ClientEventListener {
    public constructor(private readonly client: Disc_11, public name: ClientEventListener["name"]) {}

    public execute(warn: string): void {
        this.client.logger.warn("CLIENT_WARN:", warn);
    }
}
