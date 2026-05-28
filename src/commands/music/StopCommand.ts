/** biome-ignore-all lint/style/useNamingConvention: disable naming convention rule for this file */
import { type AudioPlayerPlayingState } from "@discordjs/voice";
import { ApplyOptions } from "@sapphire/decorators";
import { type Command } from "@sapphire/framework";
import { type CommandContext, ContextCommand } from "@stegripe/command-context";
import { type GuildMember, PermissionFlagsBits, type SlashCommandBuilder } from "discord.js";
import i18n from "../../config/index.js";
import { type Rawon } from "../../structures/Rawon.js";
import { type QueueSong } from "../../typings/index.js";
import {
    haveQueue,
    inVC,
    sameVC,
    useRequestChannel,
    validVC,
} from "../../utils/decorators/MusicUtil.js";
import { createEmbed } from "../../utils/functions/createEmbed.js";
import { i18n__ } from "../../utils/functions/i18n.js";
import { hasMusicControlPermission } from "../../utils/functions/musicControlPermissions.js";

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
            .setDescription(
                opts.description ?? i18n.__("commands.music.stop.description"),
            ) as SlashCommandBuilder;
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
            const currentSong = (
                q.player.state as
                    | (AudioPlayerPlayingState & { resource?: { metadata?: QueueSong } })
                    | undefined
            )?.resource?.metadata;
            const canControl = await hasMusicControlPermission({
                client,
                guild: ctx.guild as NonNullable<typeof ctx.guild>,
                member: ctx.member as GuildMember | null,
                requesterIds: [currentSong],
            });

            if (!canControl) {
                await ctx.reply({
                    embeds: [createEmbed("error", __("requestChannel.noPermission"), true)],
                });
                return;
            }

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
