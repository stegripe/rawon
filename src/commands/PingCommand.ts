import { DefineCommand } from "../utils/decorators/DefineCommand";
import { BaseCommand } from "../structures/BaseCommand";
import { Message, MessageEmbed } from "discord.js";

@DefineCommand({
    aliases: ["pang", "pung", "peng", "pong"],
    description: "Shows the current ping of the bot",
    name: "ping",
    usage: "{prefix}ping"
})
export class PingCommand extends BaseCommand {
    public execute(message: Message): Message {
        message.channel.send("🏓").then((msg: Message) => {
            const latency = msg.createdTimestamp - message.createdTimestamp;
            const wsLatency = this.client.ws.ping.toFixed(0);
            const embed = new MessageEmbed()
                .setColor(this.searchHex(wsLatency))
                .setAuthor("🏓 PONG")
                .addFields({
                    name: "📶 API",
                    value: `**\`${latency}\`** ms`,
                    inline: true
                }, {
                    name: "🌐 WebSocket",
                    value: `**\`${wsLatency}\`** ms`,
                    inline: true
                })
                .setFooter(`Latency of: ${message.client.user!.tag}`, message.client.user?.displayAvatarURL({ dynamic: true }))
                .setTimestamp();

            msg.edit("", { embed }).catch(e => this.client.logger.error("PROMISE_ERR:", e));
        }).catch(e => this.client.logger.error("PROMISE_ERR:", e));
        return message;
    }

    private searchHex(ms: string | number): string | number {
        const listColorHex = [
            [0, 20, "GREEN"],
            [21, 50, "GREEN"],
            [51, 100, "YELLOW"],
            [101, 150, "YELLOW"],
            [150, 200, "RED"]
        ];

        const defaultColor = "RED";

        const min = listColorHex.map(e => e[0]);
        const max = listColorHex.map(e => e[1]);
        const hex = listColorHex.map(e => e[2]);
        let ret: string | number = "#000000";

        for (let i = 0; i < listColorHex.length; i++) {
            if (min[i] <= ms && ms <= max[i]) {
                ret = hex[i];
                break;
            } else {
                ret = defaultColor;
            }
        }
        return ret;
    }
}
