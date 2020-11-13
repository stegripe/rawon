import { MessageEmbed } from "discord.js";
import { embedColor } from "../config";

type hexColorsType = "info" | "warn" | "error";
const hexColors: Record<hexColorsType, string> = {
    info: embedColor,
    warn: "#FFFF00",
    error: "#FF0000"
};

export function createEmbed(type: hexColorsType, message?: string): MessageEmbed {
    const embed = new MessageEmbed()
        .setColor(hexColors[type]);

    if (message) embed.setDescription(message);

    return embed;
}
