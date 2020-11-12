import { MessageEmbed } from "discord.js";
import { embedColor } from "../config";

export function createEmbed(type: "info" | "warn" | "error", message?: string): MessageEmbed {
    const hexColors = {
        info: embedColor,
        warn: "YELLOW",
        error: "RED"
    };
    const embed = new MessageEmbed()
        .setColor(hexColors[type]);

    if (message) embed.setDescription(message);

    return embed;
}
