import { type Guild } from "discord.js";
import { type Rawon } from "../../structures/Rawon.js";
import { type PlaylistMetadata } from "../../typings/index.js";
import { formatBoldCodeSpan } from "./formatCodeSpan.js";
import { i18n__mf } from "./i18n.js";

export function formatAddedPlaylistNotice(
    client: Rawon,
    guild: Guild | string | null | undefined,
    addedCount: number,
    playlistText: string,
    playlistMeta: PlaylistMetadata,
): string {
    const __mf = i18n__mf(client, guild);
    const lines = [
        __mf("requestChannel.addedPlaylistToQueue", {
            count: formatBoldCodeSpan(addedCount.toString()),
            playlist: playlistText,
        }),
    ];

    if ((playlistMeta.skippedCount ?? 0) > 0) {
        const reasonKey =
            playlistMeta.skippedReason === "unavailable"
                ? "requestChannel.skippedReasonUnavailable"
                : playlistMeta.skippedReason === "unresolved"
                  ? "requestChannel.skippedReasonUnresolved"
                  : "requestChannel.skippedReasonSkipped";
        lines.push(
            __mf("requestChannel.addedPlaylistSkipped", {
                count: formatBoldCodeSpan((playlistMeta.skippedCount ?? 0).toString()),
                reason: __mf(reasonKey),
            }),
        );
    }

    return lines.join("\n");
}
