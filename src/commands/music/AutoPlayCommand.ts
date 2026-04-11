import { ApplyOptions } from "@sapphire/decorators";
import { type Command } from "@sapphire/framework";
import { type CommandContext, ContextCommand } from "@stegripe/command-context";
import { PermissionFlagsBits, type SlashCommandBuilder } from "discord.js";
import i18n from "../../config/index.js";
import { type CommandContext as LocalCommandContext } from "../../structures/CommandContext.js";
import { type Rawon } from "../../structures/Rawon.js";
import { haveQueue, inVC, sameVC, useRequestChannel } from "../../utils/decorators/MusicUtil.js";
import { createEmbed } from "../../utils/functions/createEmbed.js";
import { formatBoldPrefixedCommand } from "../../utils/functions/formatCodeSpan.js";
import { getEffectivePrefix } from "../../utils/functions/getEffectivePrefix.js";
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
export class AutoPlayCommand extends ContextCommand {
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

        const newStateRaw =
            localCtx.options?.getString("state") ?? (localCtx.args[0] as string | undefined);
        const newState =
            typeof newStateRaw === "string" ? newStateRaw.trim().toLowerCase() : undefined;

        if (!newState) {
            void ctx.reply({
                embeds: [
                    createEmbed(
                        "info",
                        `♾️ **|** ${__mf("commands.music.autoplay.actualState", {
                            state: `**\`${ctx.guild?.queue?.autoPlay === true ? __("reusable.enabled") : __("reusable.disabled")}\`**`,
                        })}`,
                    ),
                ],
            });
            return;
        }

        if (newState !== "enable" && newState !== "disable") {
            const prefix = getEffectivePrefix(client, ctx.guild?.id ?? null);
            void ctx.reply({
                embeds: [
                    createEmbed(
                        "error",
                        __mf("reusable.invalidUsage", {
                            prefix: formatBoldPrefixedCommand(prefix, "help"),
                            name: `**\`${this.options.name}\`**`,
                        }),
                        true,
                    ),
                ],
            });
            return;
        }

        ctx.guild?.queue?.setAutoPlay(newState === "enable");
        const isAutoPlay = ctx.guild?.queue?.autoPlay;

        void ctx.reply({
            embeds: [
                createEmbed(
                    "success",
                    `♾️ **|** ${__mf("commands.music.autoplay.newState", {
                        state: `**\`${isAutoPlay === true ? __("reusable.enabled") : __("reusable.disabled")}\`**`,
                    })}`,
                ),
            ],
        });
    }
}
