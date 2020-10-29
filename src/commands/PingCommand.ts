import BaseCommand from "../structures/BaseCommand";
import { MessageEmbed } from "discord.js";
import type { IMessage } from "../../typings";
import type Disc_11 from "../structures/Disc_11";

export default class PingCommand extends BaseCommand {
    public constructor(client: Disc_11, public readonly path: string) {
        super(client, path, {
            aliases: ["pingpong", "pong", "pang", "pung", "peng", "pong"]
        }, {
            name: "ping",
            description: "Shows the current ping of the bot",
            usage: "{prefix}ping"
        });
    }

    public execute(message: IMessage): IMessage {
        const before = Date.now();
        message.channel.send("*🏓 Pinging...*").then((msg: IMessage | any) => {
            const latency = Date.now() - before;
            const wsLatency = this.client.ws.ping.toFixed(0);
            const embed = new MessageEmbed()
                .setAuthor("🏓 PONG!", message.client.user?.displayAvatarURL())
                .setColor(this.searchHex(wsLatency))
                .addFields({
                    name: "API Latency",
                    value: `**\`${latency}\`** ms`,
                    inline: true
                }, {
                    name: "WebSocket Latency",
                    value: `**\`${wsLatency}\`** ms`,
                    inline: true
                })
                .setFooter(`Requested by: ${message.author.tag}`, message.author.displayAvatarURL())
                .setTimestamp();

            msg.edit(embed);
            msg.edit("");
        }).catch(e => this.client.logger.error("PING_CMD_ERR:", e));
        return message;
    }

    private searchHex(ms: string | number): string | number {
        const listColorHex = [
            [0, 20, "#0DFF00"],
            [21, 50, "#0BC700"],
            [51, 100, "#E5ED02"],
            [101, 150, "#FF8C00"],
            [150, 200, "#FF6A00"]
        ];

        const defaultColor = "#FF0D00";

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
