/** biome-ignore-all lint/style/useNamingConvention: disable naming convention rule for this file */
import { ApplyOptions } from "@sapphire/decorators";
import { type Command } from "@sapphire/framework";
import { type CommandContext, ContextCommand } from "@stegripe/command-context";
import { type Message, PermissionFlagsBits, type SlashCommandBuilder } from "discord.js";
import i18n from "../../config/index.js";
import { type Rawon } from "../../structures/Rawon.js";
import { haveQueue, inVC, sameVC, useRequestChannel } from "../../utils/decorators/MusicUtil.js";
import { createEmbed } from "../../utils/functions/createEmbed.js";
import { i18n__ } from "../../utils/functions/i18n.js";

@ApplyOptions<Command.Options>({
    name: "resume",
    aliases: [],
    description: i18n.__("commands.music.resume.description"),
    detailedDescription: { usage: "{prefix}resume" },
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
            .setName(opts.name ?? "resume")
            .setDescription(opts.description ?? "Resume the paused song.") as SlashCommandBuilder;
    },
})
export class ResumeCommand extends ContextCommand {
    private getClient(ctx: CommandContext): Rawon {
        return ctx.client as Rawon;
    }

    @useRequestChannel
    @inVC
    @haveQueue
    @sameVC
    public contextRun(ctx: CommandContext): Promise<Message> | undefined {
        const client = this.getClient(ctx);
        const __ = i18n__(client, ctx.guild);

        if (ctx.guild?.queue?.playing === true) {
            return ctx.reply({
                embeds: [createEmbed("warn", __("commands.music.resume.alreadyResume"))],
            });
        }
        (
            ctx.guild?.queue as unknown as NonNullable<NonNullable<typeof ctx.guild>["queue"]>
        ).playing = true;

        return ctx.reply({
            embeds: [
                createEmbed("success", `▶️ **|** ${__("commands.music.resume.resumeMessage")}`),
            ],
        });
    }
}
