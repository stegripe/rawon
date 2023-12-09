import { CommandContext } from "#rawon/structures/CommandContext.js";
import { createEmbed } from "#rawon/utils/functions/createEmbed.js";
import { BaseCommand } from "#rawon/structures/BaseCommand.js";
import { Command } from "#rawon/utils/decorators/Command.js";
import { ColorResolvable } from "discord.js";

@Command<typeof PingCommand>({
    aliases: ["pong", "pang", "pung", "peng", "pingpong"],
    description: "Shows current ping of the bot",
    name: "ping",
    usage: "{prefix}ping"
})
export class PingCommand extends BaseCommand {
    public async execute(ctx: CommandContext): Promise<void> {
        const msg = await ctx.reply("🏓");
        const latency = msg.createdTimestamp - ctx.context.createdTimestamp;
        const wsLatency = this.client.ws.ping.toFixed(0);
        const embed = createEmbed("info")
            .setColor(PingCommand.searchHex(wsLatency))
            .setAuthor({ name: "🏓 PONG" })
            .addFields({
                name: "📶 **|** API",
                value: `**\`${latency}\`** ms`,
                inline: true
            }, {
                name: "🌐 **|** WebSocket",
                value: `**\`${wsLatency}\`** ms`,
                inline: true
            })
            .setFooter({
                text: `Latency of: ${this.client.user!.tag}`,
                iconURL: this.client.user?.displayAvatarURL()
            })
            .setTimestamp();

        await msg.edit({ content: " ", embeds: [embed] });
    }

    private static searchHex(ms: number | string): ColorResolvable {
        const listColorHex = [
            [0, 20, "Green"],
            [21, 50, "Green"],
            [51, 100, "Yellow"],
            [101, 150, "Yellow"],
            [150, 200, "Red"]
        ];

        const defaultColor = "Red";

        const min = listColorHex.map(e => e[0]);
        const max = listColorHex.map(e => e[1]);
        const hex = listColorHex.map(e => e[2]);
        let ret: number | string = "#000000";

        for (let i = 0; i < listColorHex.length; i++) {
            if (min[i] <= ms && ms <= max[i]) {
                ret = hex[i];
                break;
            } else {
                ret = defaultColor;
            }
        }
        return ret as ColorResolvable;
    }
}
