import { ClientEventListener } from "../../typings";
import Disc_11 from "../structures/Disc_11";
import { DefineListener } from "../utils/decorators/DefineListener";

@DefineListener("error")
export default class ErrorEvent implements ClientEventListener {
    public constructor(private readonly client: Disc_11, public name: ClientEventListener["name"]) {}

    public execute(error: string): void {
        this.client.logger.error("CLIENT_ERROR:", error);
    }
}
