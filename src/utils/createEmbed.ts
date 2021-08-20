import { embedColor } from "../config";
import { ColorResolvable, MessageEmbed } from "discord.js";

type hexColorsType = "info" | "warn" | "error";
const hexColors: Record<hexColorsType, ColorResolvable> = {
    info: embedColor as ColorResolvable,
    warn: "YELLOW",
    error: "RED"
};

export function createEmbed(type: hexColorsType, message?: string): MessageEmbed {
    const embed = new MessageEmbed()
        .setColor(hexColors[type]);

    if (message) embed.setDescription(message);

    return embed;
}
