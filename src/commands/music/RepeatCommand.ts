/** biome-ignore-all lint/style/useNamingConvention: disable naming convention rule for this file */
import { ApplyOptions } from "@sapphire/decorators";
import { type Command } from "@sapphire/framework";
import { type CommandContext, ContextCommand } from "@stegripe/command-context";
import { type Message, PermissionFlagsBits, type SlashCommandBuilder } from "discord.js";
import i18n from "../../config/index.js";
import { type CommandContext as LocalCommandContext } from "../../structures/CommandContext.js";
import { type Rawon } from "../../structures/Rawon.js";
import { type LoopMode } from "../../typings/index.js";
import { haveQueue, inVC, sameVC, useRequestChannel } from "../../utils/decorators/MusicUtil.js";
import { createEmbed } from "../../utils/functions/createEmbed.js";
import { getEffectivePrefix } from "../../utils/functions/getEffectivePrefix.js";
import { i18n__mf } from "../../utils/functions/i18n.js";

@ApplyOptions<Command.Options>({
    name: "repeat",
    aliases: ["loop", "music-repeat", "music-loop"],
    description: i18n.__("commands.music.repeat.description"),
    detailedDescription: {
        usage: i18n.__mf("commands.music.repeat.usage", { options: "queue | one | disable" }),
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
            .setName(opts.name ?? "repeat")
            .setDescription(opts.description ?? i18n.__("commands.music.repeat.description"))
            .addSubcommand((sub) =>
                sub.setName("queue").setDescription(i18n.__("commands.music.repeat.slashQueue")),
            )
            .addSubcommand((sub) =>
                sub.setName("song").setDescription(i18n.__("commands.music.repeat.slashSong")),
            )
            .addSubcommand((sub) =>
                sub
                    .setName("disable")
                    .setDescription(i18n.__("commands.music.repeat.slashDisable")),
            ) as SlashCommandBuilder;
    },
})
export class RepeatCommand extends ContextCommand {
    private getClient(ctx: CommandContext): Rawon {
        return ctx.client as Rawon;
    }

    @useRequestChannel
    @inVC
    @haveQueue
    @sameVC
    public contextRun(ctx: CommandContext): Promise<Message> | undefined {
        const localCtx = ctx as unknown as LocalCommandContext;
        const client = this.getClient(ctx);
        const __mf = i18n__mf(client, ctx.guild);

        const mode: Record<LoopMode, { aliases: string[]; emoji: string }> = {
            OFF: {
                aliases: ["disable", "off", "0"],
                emoji: "▶️",
            },
            QUEUE: {
                aliases: ["all", "queue"],
                emoji: "🔁",
            },
            SONG: {
                aliases: ["one", "song", "current", "this", "1"],
                emoji: "🔂",
            },
        };
        const selection =
            (localCtx.options?.getSubcommand() ?? localCtx.args[0])
                ? Object.keys(mode).find((key) =>
                      mode[key as LoopMode].aliases.includes(
                          localCtx.args[0] ?? localCtx.options?.getSubcommand(),
                      ),
                  )
                : undefined;

        if ((selection?.length ?? 0) === 0) {
            return ctx.reply({
                embeds: [
                    createEmbed(
                        "info",
                        `${mode[ctx.guild?.queue?.loopMode ?? "OFF"].emoji} **|** ${__mf(
                            "commands.music.repeat.actualMode",
                            {
                                mode: `**\`${ctx.guild?.queue?.loopMode}\`**`,
                            },
                        )}`,
                    ).setFooter({
                        text: `• ${__mf("commands.music.repeat.footer", {
                            prefix: getEffectivePrefix(client, ctx.guild?.id ?? null),
                        })}`,
                    }),
                ],
            });
        }
        ctx.guild?.queue?.setLoopMode(selection as LoopMode);

        return ctx.reply({
            embeds: [
                createEmbed(
                    "success",
                    `${mode[ctx.guild?.queue?.loopMode ?? "OFF"].emoji} **|** ${__mf(
                        "commands.music.repeat.newMode",
                        {
                            mode: `**\`${ctx.guild?.queue?.loopMode}\`**`,
                        },
                    )}`,
                ),
            ],
        });
    }
}
