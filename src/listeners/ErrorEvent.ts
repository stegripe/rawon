import type { ClientEventListener } from "../../typings";
import type Disc_11 from "../structures/Disc_11";

export default class ErrorEvent implements ClientEventListener {
    public readonly name = "error";
    public constructor(private readonly client: Disc_11) {}

    public execute(error: string): void {
        this.client.logger.error("CLIENT_ERROR:", error);
    }
}
