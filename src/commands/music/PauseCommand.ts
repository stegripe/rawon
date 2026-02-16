/** biome-ignore-all lint/style/useNamingConvention: disable naming convention rule for this file */
import { ApplyOptions } from "@sapphire/decorators";
import { type Command } from "@sapphire/framework";
import { type CommandContext, ContextCommand } from "@stegripe/command-context";
import { PermissionFlagsBits, type SlashCommandBuilder } from "discord.js";
import i18n from "../../config/index.js";
import { type Rawon } from "../../structures/Rawon.js";
import { haveQueue, inVC, sameVC, useRequestChannel } from "../../utils/decorators/MusicUtil.js";
import { createEmbed } from "../../utils/functions/createEmbed.js";
import { i18n__ } from "../../utils/functions/i18n.js";

@ApplyOptions<Command.Options>({
    name: "pause",
    aliases: [],
    description: i18n.__("commands.music.pause.description"),
    detailedDescription: { usage: "{prefix}pause" },
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
            .setName(opts.name ?? "pause")
            .setDescription(
                opts.description ?? i18n.__("commands.music.pause.description"),
            ) as SlashCommandBuilder;
    },
})
export class PauseCommand extends ContextCommand {
    private getClient(ctx: CommandContext): Rawon {
        return ctx.client as Rawon;
    }

    @useRequestChannel
    @inVC
    @haveQueue
    @sameVC
    public async contextRun(ctx: CommandContext): Promise<void> {
        const client = this.getClient(ctx);
        const __ = i18n__(client, ctx.guild);

        if (ctx.guild?.queue?.playing !== true) {
            await ctx.reply({
                embeds: [createEmbed("warn", __("commands.music.pause.alreadyPause"))],
            });

            return;
        }

        ctx.guild.queue.playing = false;

        await ctx.reply({
            embeds: [createEmbed("success", `⏸️ **|** ${__("commands.music.pause.pauseMessage")}`)],
        });
    }
}
