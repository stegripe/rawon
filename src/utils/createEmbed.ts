import { embedColor, noEmoji, yesEmoji } from "../config";
import { ColorResolvable, MessageEmbed } from "discord.js";

type hexColorsType = "info" | "warn" | "error" | "success";
const hexColors: Record<hexColorsType, string> = {
    error: "RED",
    info: embedColor,
    success: "GREEN",
    warn: "YELLOW"
};

export function createEmbed(type: hexColorsType, message?: string, emoji = false): MessageEmbed {
    const embed = new MessageEmbed()
        .setColor(hexColors[type] as ColorResolvable);

    if (message) embed.setDescription(message);
    if (type === "error" && emoji) embed.setDescription(`${noEmoji} **|** ${message!}`);
    if (type === "success" && emoji) embed.setDescription(`${yesEmoji} **|** ${message!}`);
    return embed;
}
