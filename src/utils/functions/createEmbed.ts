import { embedColor } from "../../config/index.js";
import { ColorResolvable, EmbedBuilder } from "discord.js";

type hexColorsType = "error" | "info" | "success" | "warn";
const hexColors: Record<hexColorsType, string> = {
    error: "Red",
    info: embedColor as string,
    success: "Green",
    warn: "Yellow"
};

export function createEmbed(type: hexColorsType, message?: string, emoji = false): EmbedBuilder {
    const embed = new EmbedBuilder()
        .setColor(hexColors[type] as ColorResolvable);

    if (message) embed.setDescription(message);
    if (type === "error" && emoji) embed.setDescription(`❌ **|** ${message!}`);
    if (type === "success" && emoji) embed.setDescription(`✅ **|** ${message!}`);
    return embed;
}
