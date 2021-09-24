import { Disc } from "../structures/Disc";

export class ClientUtils {
    public constructor(public readonly client: Disc) {}

    public decode(string: string): string {
        return Buffer.from(string, "base64").toString("ascii");
    }
}
