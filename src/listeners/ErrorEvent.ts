import type { ClientEventListener } from "../../typings";
import type Jukebox from "../structures/Jukebox";

export default class ErrorEvent implements ClientEventListener {
    public readonly name = "error";
    public constructor(private readonly client: Jukebox) {}

    public execute(error: string): void {
        this.client.logger.error("CLIENT_ERROR:", error);
    }
}
