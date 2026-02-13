import { type ColorResolvable, EmbedBuilder } from "discord.js";
import { embedColor, noEmoji, yesEmoji } from "../../config/index.js";

type HexColorsType = "error" | "info" | "success" | "warn";
const hexColors: Record<HexColorsType, string> = {
    error: "Red",
    info: embedColor,
    success: "Green",
    warn: "Yellow",
};

export function createEmbed(type: HexColorsType, message?: string, emoji = false): EmbedBuilder {
    const embed = new EmbedBuilder().setColor(hexColors[type] as ColorResolvable);

    if ((message?.length ?? 0) > 0) {
        embed.setDescription(message ?? null);
    }
    if (type === "error" && emoji && message) {
        embed.setDescription(`${noEmoji} **|** ${message}`);
    }
    if (type === "success" && emoji && message) {
        embed.setDescription(`${yesEmoji} **|** ${message}`);
    }
    return embed;
}
