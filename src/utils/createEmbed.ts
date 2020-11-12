import { MessageEmbed } from "discord.js";

export function createEmbed(type: "info" | "warn" | "error", message?: string): MessageEmbed {
    const hexColors = {
        info: "#7289DA",
        warn: "YELLOW",
        error: "RED"
    };
    const embed = new MessageEmbed()
        .setColor(hexColors[type]);

    if (message) embed.setDescription(message);

    return embed;
}
