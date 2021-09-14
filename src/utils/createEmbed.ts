import { embedColor } from "../config";
import { ColorResolvable, MessageEmbed } from "discord.js";

type hexColorsType = "info" | "warn" | "error" | "success";
const hexColors: Record<hexColorsType, string> = {
    error: "RED",
    info: embedColor as string,
    success: "GREEN",
    warn: "YELLOW"
};

export function createEmbed(type: hexColorsType, message?: string, emoji = false): MessageEmbed {
    const embed = new MessageEmbed()
        .setColor(hexColors[type] as ColorResolvable);

    if (message) embed.setDescription(message);
    if (type === "error" && emoji) embed.setDescription(`❌ **|** ${message!}`);
    if (type === "success" && emoji) embed.setDescription(`✅ **|** ${message!}`);
    return embed;
}
