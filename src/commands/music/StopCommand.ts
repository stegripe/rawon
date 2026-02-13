/** biome-ignore-all lint/style/useNamingConvention: disable naming convention rule for this file */
import { ApplyOptions } from "@sapphire/decorators";
import { type Command } from "@sapphire/framework";
import { type CommandContext, ContextCommand } from "@stegripe/command-context";
import { PermissionFlagsBits, type SlashCommandBuilder } from "discord.js";
import i18n from "../../config/index.js";
import { type Rawon } from "../../structures/Rawon.js";
import {
    haveQueue,
    inVC,
    sameVC,
    useRequestChannel,
    validVC,
} from "../../utils/decorators/MusicUtil.js";
import { createEmbed } from "../../utils/functions/createEmbed.js";
import { i18n__ } from "../../utils/functions/i18n.js";

@ApplyOptions<Command.Options>({
    name: "stop",
    aliases: ["disconnect", "dc"],
    description: i18n.__("commands.music.stop.description"),
    detailedDescription: { usage: "{prefix}stop" },
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
            .setName(opts.name ?? "stop")
            .setDescription(opts.description ?? "Stop the music player.") as SlashCommandBuilder;
    },
})
export class StopCommand extends ContextCommand {
    private getClient(ctx: CommandContext): Rawon {
        return ctx.client as Rawon;
    }

    @useRequestChannel
    @inVC
    @validVC
    @haveQueue
    @sameVC
    public async contextRun(ctx: CommandContext): Promise<void> {
        const client = this.getClient(ctx);
        const __ = i18n__(client, ctx.guild);

        const q = ctx.guild?.queue;
        if (q) {
            q.lastMusicMsg = null;
            await q.destroy();
        }

        await ctx
            .reply({
                embeds: [
                    createEmbed("success", `⏹️ **|** ${__("commands.music.stop.stoppedMessage")}`),
                ],
            })
            .catch((error: unknown) => this.container.logger.error("STOP_CMD_ERR:", error));
    }
}
