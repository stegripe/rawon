import { ApplyOptions } from "@sapphire/decorators";
import { type Command } from "@sapphire/framework";
import { type CommandContext, ContextCommand } from "@stegripe/command-context";
import { PermissionFlagsBits, type SlashCommandBuilder } from "discord.js";
import i18n from "../../config/index.js";
import { type CommandContext as LocalCommandContext } from "../../structures/CommandContext.js";
import { type Rawon } from "../../structures/Rawon.js";
import { haveQueue, inVC, sameVC, useRequestChannel } from "../../utils/decorators/MusicUtil.js";
import { createEmbed } from "../../utils/functions/createEmbed.js";
import { i18n__, i18n__mf } from "../../utils/functions/i18n.js";

@ApplyOptions<Command.Options>({
    name: "autoplay",
    aliases: ["ap"],
    description: i18n.__("commands.music.autoplay.description"),
    detailedDescription: { usage: "{prefix}autoplay [enable | disable]" },
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
            .setName(opts.name ?? "autoplay")
            .setDescription(opts.description ?? i18n.__("commands.music.autoplay.description"))
            .addStringOption((opt) =>
                opt
                    .setName("state")
                    .setDescription(i18n.__("commands.music.autoplay.description"))
                    .setRequired(false)
                    .addChoices(
                        { name: "ENABLE", value: "enable" },
                        { name: "DISABLE", value: "disable" },
                    ),
            ) as SlashCommandBuilder;
    },
})
export class AutoplayCommand extends ContextCommand {
    private getClient(ctx: CommandContext): Rawon {
        return ctx.client as Rawon;
    }

    @useRequestChannel
    @inVC
    @haveQueue
    @sameVC
    public contextRun(ctx: CommandContext): void {
        const localCtx = ctx as CommandContext & LocalCommandContext;
        const client = this.getClient(ctx);
        const __ = i18n__(client, ctx.guild);
        const __mf = i18n__mf(client, ctx.guild);

        const newState =
            localCtx.options?.getString("state") ?? (localCtx.args[0] as string | undefined);
        if ((newState?.length ?? 0) === 0) {
            void ctx.reply({
                embeds: [
                    createEmbed(
                        "info",
                        `♾️ **|** ${__mf("commands.music.autoplay.actualState", {
                            state: `**\`${ctx.guild?.queue?.autoplay === true ? __("reusable.enabled") : __("reusable.disabled")}\`**`,
                        })}`,
                    ),
                ],
            });
            return;
        }

        ctx.guild?.queue?.setAutoplay(newState === "enable");
        const isAutoplay = ctx.guild?.queue?.autoplay;

        void ctx.reply({
            embeds: [
                createEmbed(
                    "success",
                    `♾️ **|** ${__mf("commands.music.autoplay.newState", {
                        state: `**\`${isAutoplay === true ? __("reusable.enabled") : __("reusable.disabled")}\`**`,
                    })}`,
                ),
            ],
        });
    }
}
