import { container } from "@sapphire/framework";
import { type ColorResolvable, EmbedBuilder } from "discord.js";

type HexColorsType = "error" | "info" | "success" | "warn";

export function createEmbed(type: HexColorsType, message?: string, emoji = false): EmbedBuilder {
    const bs = container.data.botSettings;

    const colors: Record<HexColorsType, string> = {
        error: "Red",
        info: bs.embedColor,
        success: "Green",
        warn: "Yellow",
    };

    const embed = new EmbedBuilder().setColor(colors[type] as ColorResolvable);

    if ((message?.length ?? 0) > 0) {
        embed.setDescription(message ?? null);
    }
    if (type === "error" && emoji && message) {
        embed.setDescription(`${bs.noEmoji} **|** ${message}`);
    }
    if (type === "success" && emoji && message) {
        embed.setDescription(`${bs.yesEmoji} **|** ${message}`);
    }
    return embed;
}
