/** biome-ignore-all lint/style/useNamingConvention: disable naming convention rule for this file */
import { ApplyOptions } from "@sapphire/decorators";
import { type Command } from "@sapphire/framework";
import { type CommandContext, ContextCommand } from "@stegripe/command-context";
import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ComponentType,
    type GuildMember,
    type Message,
    PermissionFlagsBits,
    type SlashCommandBuilder,
} from "discord.js";
import i18n from "../../config/index.js";
import { CommandContext as LocalCommandContext } from "../../structures/CommandContext.js";
import { type Rawon } from "../../structures/Rawon.js";
import { haveQueue, inVC, sameVC, validVC } from "../../utils/decorators/MusicUtil.js";
import { createEmbed } from "../../utils/functions/createEmbed.js";
import { createProgressBar } from "../../utils/functions/createProgressBar.js";
import { i18n__, i18n__mf } from "../../utils/functions/i18n.js";

@ApplyOptions<Command.Options>({
    name: "volume",
    aliases: ["vol"],
    description: i18n.__("commands.music.volume.description"),
    detailedDescription: { usage: i18n.__("commands.music.volume.usage") },
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
            .setName(opts.name ?? "volume")
            .setDescription(opts.description ?? "Change the media player volume.")
            .addNumberOption((opt) =>
                opt
                    .setName("volume")
                    .setDescription(i18n.__("commands.music.volume.slashDescription"))
                    .setRequired(false),
            ) as SlashCommandBuilder;
    },
})
export class VolumeCommand extends ContextCommand {
    private getClient(ctx: CommandContext): Rawon {
        return ctx.client as Rawon;
    }

    @inVC
    @validVC
    @haveQueue
    @sameVC
    public async contextRun(ctx: CommandContext): Promise<Message | undefined> {
        const localCtx = ctx as unknown as LocalCommandContext;
        const member = localCtx.member as GuildMember | null;
        const client = this.getClient(ctx);
        const __ = i18n__(client, ctx.guild);
        const __mf = i18n__mf(client, ctx.guild);

        const volume = Number(localCtx.args[0] ?? localCtx.options?.get("volume", false)?.value);
        const current = ctx.guild?.queue?.volume ?? Number.NaN;

        if (Number.isNaN(volume)) {
            const buttons = new ActionRowBuilder<ButtonBuilder>().addComponents(
                new ButtonBuilder().setCustomId("10").setLabel("10%").setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId("25").setLabel("25%").setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId("50").setLabel("50%").setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId("75").setLabel("75%").setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId("100")
                    .setLabel("100%")
                    .setStyle(ButtonStyle.Primary),
            );

            const msg = await ctx.reply({
                embeds: [
                    createEmbed(
                        "info",
                        `🔊 **|** ${__mf("commands.music.volume.currentVolume", {
                            volume: `**\`${current}%\`**`,
                        })}\n${current}% ${createProgressBar(current, 100)} 100%`,
                    ).setFooter({ text: `• ${__("commands.music.volume.changeVolume")}` }),
                ],
                components: [buttons],
            });

            const collector = msg.createMessageComponentCollector({
                componentType: ComponentType.Button,
                filter: (i) => i.isButton() && i.user.id === ctx.author.id,
                idle: 30_000,
            });

            collector
                .on("collect", async (i) => {
                    const newContext = new LocalCommandContext(i, [i.customId]);
                    const newVolume = Number(i.customId);
                    await this.contextRun(newContext as unknown as CommandContext);

                    void msg.edit({
                        embeds: [
                            createEmbed(
                                "info",
                                `🔊 **|** ${__mf("commands.music.volume.currentVolume", {
                                    volume: `**\`${newVolume}%\`**`,
                                })}\n${newVolume}% ${createProgressBar(newVolume, 100)} 100%`,
                            ).setFooter({
                                text: `• ${__("commands.music.volume.changeVolume")}`,
                            }),
                        ],
                        components: [buttons],
                    });
                })
                .on("end", () => {
                    const cur = ctx.guild?.queue?.volume ?? 0;
                    void msg.edit({
                        embeds: [
                            createEmbed(
                                "info",
                                `🔊 **|** ${__mf("commands.music.volume.currentVolume", {
                                    volume: `**\`${cur}%\`**`,
                                })}\n${cur}% ${createProgressBar(cur, 100)} 100%`,
                            ).setFooter({
                                text: `• ${__("commands.music.volume.changeVolume")}`,
                            }),
                        ],
                        components: [],
                    });
                });
            return;
        }
        if (volume <= 0) {
            await ctx.reply({
                embeds: [
                    createEmbed(
                        "warn",
                        __mf("commands.music.volume.plsPause", {
                            volume: `**\`${volume}%\`**`,
                        }),
                    ),
                ],
            });
            return;
        }

        if (volume > 100) {
            const djRole = await client.utils
                .fetchDJRole(ctx.guild as unknown as GuildMember["guild"])
                .catch(() => null);
            const hasPermission =
                member?.roles.cache.has(djRole?.id ?? "") === true ||
                member?.permissions.has("ManageGuild") === true;

            if (!hasPermission) {
                await ctx.reply({
                    embeds: [createEmbed("error", __("commands.music.volume.noPermission"), true)],
                });
                return;
            }
        }

        (
            ctx.guild?.queue as unknown as NonNullable<NonNullable<typeof ctx.guild>["queue"]>
        ).volume = volume;
        await ctx.reply({
            embeds: [
                createEmbed(
                    "success",
                    `🔊 **|** ${__mf("commands.music.volume.newVolume", {
                        volume: `**\`${volume}%\`**`,
                    })}`,
                ),
            ],
        });
    }
}
