import { CommandContext } from "../../structures/CommandContext";
import { BaseCommand } from "../../structures/BaseCommand";
import { createEmbed } from "../../utils/createEmbed";
import i18n from "../../config";
import { ColorResolvable } from "discord.js";

export class PingCommand extends BaseCommand {
    public constructor(client: BaseCommand["client"]) {
        super(client, {
            aliases: ["pang", "pung", "peng", "pong"],
            description: i18n.__("commands.general.ping.description"),
            name: "ping",
            slash: {
                options: []
            },
            usage: "{prefix}ping"
        });
    }

    public async execute(ctx: CommandContext): Promise<void> {
        if (ctx.isInteraction() && !ctx.deferred) await ctx.deferReply();
        const before = Date.now();
        const msg = await ctx.send({ content: "🏓" });
        const latency = Date.now() - before;
        const wsLatency = this.client.ws.ping.toFixed(0);
        const vcLatency = ctx.guild?.queue?.connection?.ping.ws?.toFixed(0) ?? "N/A";
        const embed = createEmbed("info")
            .setColor(this.searchHex(wsLatency))
            .setAuthor("🏓 PONG", this.client.user!.displayAvatarURL())
            .addFields({
                name: "📶 **|** API",
                value: `**\`${latency}\`** ms`,
                inline: true
            }, {
                name: "🌐 **|** WebSocket",
                value: `**\`${wsLatency}\`** ms`,
                inline: true
            }, {
                name: "🔊 **|** Voice",
                value: `**\`${vcLatency}\`** ms`,
                inline: true
            })
            .setFooter(i18n.__mf("commands.general.ping.footerString", { user: this.client.user!.tag }), this.client.user!.displayAvatarURL())
            .setTimestamp();
        msg.edit({ content: " ", embeds: [embed] }).catch(e => this.client.logger.error("PROMISE_ERR:", e));
    }

    private searchHex(ms: string | number): ColorResolvable {
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
        return ret as ColorResolvable;
    }
}
