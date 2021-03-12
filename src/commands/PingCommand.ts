import { BaseCommand } from "../structures/BaseCommand";
import { MessageEmbed } from "discord.js";
import { IMessage } from "../../typings";
import { DefineCommand } from "../utils/decorators/DefineCommand";

@DefineCommand({
    aliases: ["pong", "pang", "pung", "peng", "pingpong"],
    name: "ping",
    description: "Show the current ping of the bot",
    usage: "{prefix}ping"
})
export class PingCommand extends BaseCommand {
    public execute(message: IMessage): IMessage {
        const before = Date.now();
        message.channel.send("🏓").then((msg: IMessage | any) => {
            const latency = Date.now() - before;
            const wsLatency = this.client.ws.ping.toFixed(0);
            const embed = new MessageEmbed()
                .setAuthor("🏓 PONG", message.client.user?.displayAvatarURL())
                .setColor(this.searchHex(wsLatency))
                .addFields({
                    name: "📶 | API",
                    value: `**\`${latency}\`** ms`,
                    inline: true
                }, {
                    name: "🌐 | WebSocket",
                    value: `**\`${wsLatency}\`** ms`,
                    inline: true
                })
                .setFooter(`Requested by: ${message.author.tag}`, message.author.displayAvatarURL());
            msg.edit(embed);
            msg.edit("");
        }).catch(e => this.client.logger.error("PING_CMD_ERR:", e));
        return message;
    }

    private searchHex(ms: string | number): string | number {
        const listColorHex = [
            [0, 20, "GREEN"],
            [21, 50, "GREEN"],
            [51, 100, "YELLOW"],
            [101, 150, "YELLOW"],
            [150, 200, "YELLOW"]
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
