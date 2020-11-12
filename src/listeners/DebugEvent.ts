import type { ClientEventListener } from "../../typings";
import type Disc_11 from "../structures/Disc_11";
import { DefineListener } from "../utils/decorators/DefineListener";

@DefineListener("debug")
export default class DebugEvent implements ClientEventListener {
    public constructor(private readonly client: Disc_11, public name: ClientEventListener["name"]) {}

    public execute(message: string): void {
        this.client.logger.debug(message);
    }
}
