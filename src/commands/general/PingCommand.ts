/** biome-ignore-all lint/style/useNamingConvention: disable naming convention rule for this file */
import { ApplyOptions } from "@sapphire/decorators";
import { type Command } from "@sapphire/framework";
import { type CommandContext, ContextCommand } from "@stegripe/command-context";
import { type ColorResolvable, PermissionFlagsBits, type SlashCommandBuilder } from "discord.js";
import i18n from "../../config/index.js";
import { type Rawon } from "../../structures/Rawon.js";
import { createEmbed } from "../../utils/functions/createEmbed.js";
import { i18n__mf } from "../../utils/functions/i18n.js";

@ApplyOptions<Command.Options>({
    name: "ping",
    aliases: ["pang", "pung", "peng", "pong"],
    description: i18n.__("commands.general.ping.description"),
    detailedDescription: {
        usage: "{prefix}ping",
    },
    requiredClientPermissions: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.EmbedLinks,
    ],
    chatInputCommand(
        builder: Parameters<NonNullable<Command.Options["chatInputCommand"]>>[0],
        opts: Parameters<NonNullable<Command.Options["chatInputCommand"]>>[1],
    ): SlashCommandBuilder {
        return builder
            .setName(opts.name ?? "ping")
            .setDescription(
                opts.description ?? "Show the current ping of the bot.",
            ) as SlashCommandBuilder;
    },
})
export class PingCommand extends ContextCommand {
    public async contextRun(ctx: CommandContext): Promise<void> {
        if (ctx.isCommandInteraction() && !ctx.deferred) {
            await ctx.deferReply();
        }

        const client = ctx.client as Rawon;
        const __mf = i18n__mf(client, ctx.guild);

        const before = Date.now();
        const msg = await ctx.reply({ content: "🏓" });
        const latency = Date.now() - before;
        const wsLatency = client.ws.ping.toFixed(0);
        const vcLatency = ctx.guild?.queue?.connection?.ping.ws?.toFixed(0) ?? "N/A";
        const embed = createEmbed("info")
            .setColor(PingCommand.searchHex(wsLatency))
            .setAuthor({
                name: "🏓 PONG",
            })
            .addFields(
                {
                    name: "📶 **|** API",
                    value: `\`${latency}\` ms`,
                    inline: true,
                },
                {
                    name: "🌐 **|** WebSocket",
                    value: `\`${wsLatency}\` ms`,
                    inline: true,
                },
                {
                    name: "🔊 **|** Voice",
                    value: `\`${vcLatency}\` ms`,
                    inline: true,
                },
            )
            .setFooter({
                text: __mf("commands.general.ping.footerString", {
                    user: client.user?.tag,
                }),
                iconURL: client.user?.displayAvatarURL(),
            })
            .setTimestamp();

        if (ctx.isCommandInteraction()) {
            await ctx.send({ content: "", embeds: [embed] });
            return;
        }

        await msg
            .edit({ content: " ", embeds: [embed] })
            .catch((error: unknown) => this.container.logger.error("PROMISE_ERR:", error));
    }

    private static searchHex(ms: number | string): ColorResolvable {
        const listColorHex = [
            [0, 20, "Green"],
            [21, 50, "Green"],
            [51, 100, "Yellow"],
            [101, 150, "Yellow"],
            [150, 200, "Red"],
        ];

        const defaultColor = "Red";

        const min = listColorHex.map((el) => el[0]);
        const max = listColorHex.map((el) => el[1]);
        const hex = listColorHex.map((el) => el[2]);
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
