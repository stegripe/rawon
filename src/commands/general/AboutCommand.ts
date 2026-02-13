/** biome-ignore-all lint/style/useNamingConvention: disable naming convention rule for this file */
import { readFileSync } from "node:fs";
import { uptime } from "node:os";
import process from "node:process";
import { URL } from "node:url";
import { ApplyOptions } from "@sapphire/decorators";
import { type Command } from "@sapphire/framework";
import { type CommandContext, ContextCommand } from "@stegripe/command-context";
import { version as DjsVersion, PermissionFlagsBits, type SlashCommandBuilder } from "discord.js";
import i18n from "../../config/index.js";
import { type Rawon } from "../../structures/Rawon.js";
import { createEmbed } from "../../utils/functions/createEmbed.js";
import { createTable } from "../../utils/functions/createTable.js";
import { formatMS } from "../../utils/functions/formatMS.js";
import { i18n__, i18n__mf } from "../../utils/functions/i18n.js";

const pkg = JSON.parse(
    readFileSync(new URL("../../../package.json", import.meta.url)).toString(),
) as { version: string };

@ApplyOptions<Command.Options>({
    name: "about",
    aliases: ["information", "info", "botinfo", "stats"],
    description: i18n.__("commands.general.about.description"),
    detailedDescription: { usage: "{prefix}about" },
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
            .setName(opts.name ?? "about")
            .setDescription(
                opts.description ?? "Show the bot's information.",
            ) as SlashCommandBuilder;
    },
})
export class AboutCommand extends ContextCommand {
    public async contextRun(ctx: CommandContext): Promise<void> {
        const client = ctx.client as Rawon;
        const __ = i18n__(client, ctx.guild);
        const __mf = i18n__mf(client, ctx.guild);

        const values = [
            [__("commands.general.about.osUptimeString"), formatMS(uptime() * 1_000)],
            [__("commands.general.about.processUptimeString"), formatMS(process.uptime() * 1_000)],
            [__("commands.general.about.botUptimeString"), formatMS(process.uptime() * 1_000)],
            [""],
            [
                __("commands.general.about.cachedUsersString"),
                `${await client.utils.getUserCount()}`,
            ],
            [
                __("commands.general.about.channelsString"),
                `${await client.utils.getChannelCount()}`,
            ],
            [__("commands.general.about.serversString"), `${await client.utils.getGuildCount()}`],
            [""],
            [__("commands.general.about.nodeVersionString"), process.versions.node],
            [__("commands.general.about.discordJSVersionString"), DjsVersion],
            [__("commands.general.about.ffmpegVersionString"), client.utils.getFFmpegVersion()],
            [__("commands.general.about.botVersionString"), pkg.version],
            [__("commands.general.about.commitString"), client.utils.getCommitHash("HEAD")],
            [""],
            [__("commands.general.about.sourceCodeString"), "https://github.com/stegripe/rawon"],
        ];
        const value = createTable(values);

        await ctx
            .reply({
                embeds: [
                    createEmbed("info", `\`\`\`asciidoc\n${value}\n\`\`\``).setAuthor({
                        name: __mf("commands.general.about.aboutFooter", {
                            botname: client.user?.username ?? "Unknown",
                        }),
                    }),
                ],
            })
            .catch((error: unknown) => this.container.logger.error("ABOUT_CMD_ERR:", error));
    }
}
