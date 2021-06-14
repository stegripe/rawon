import { embedColor } from "../config";
import { MessageEmbed } from "discord.js";

type hexColorsType = "info" | "warn" | "error";
const hexColors: Record<hexColorsType, string> = {
    info: embedColor,
    warn: "YELLOW",
    error: "RED"
};

export function createEmbed(type: hexColorsType, message?: string): MessageEmbed {
    const embed = new MessageEmbed()
        .setColor(hexColors[type]);

    if (message) embed.setDescription(message);

    return embed;
}
