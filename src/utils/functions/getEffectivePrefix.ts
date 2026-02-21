import { type Rawon } from "../../structures/Rawon.js";

export function getEffectivePrefix(client: Rawon, guildId: string | null): string {
    if (!guildId) {
        return client.config.mainPrefix;
    }
    const guildPrefix = client.data.getPrefix(guildId);
    return guildPrefix ?? client.config.mainPrefix;
}
