/** biome-ignore-all lint/style/useNamingConvention: disable naming convention rule for this file */
import { ApplyOptions } from "@sapphire/decorators";
import { type Command } from "@sapphire/framework";
import { type CommandContext, ContextCommand } from "@stegripe/command-context";
import {
    ChannelType,
    type Message,
    PermissionFlagsBits,
    PermissionsBitField,
    type SlashCommandBuilder,
    type TextChannel,
} from "discord.js";
import i18n from "../../config/index.js";
import { type Rawon } from "../../structures/Rawon.js";
import { createEmbed } from "../../utils/functions/createEmbed.js";
import { i18n__, i18n__mf } from "../../utils/functions/i18n.js";

@ApplyOptions<Command.Options>({
    name: "requestchannel",
    aliases: ["rc", "reqchannel", "musicchannel"],
    description: i18n.__("commands.music.requestChannel.description"),
    detailedDescription: { usage: i18n.__("commands.music.requestChannel.usage") },
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
            .setName(opts.name ?? "requestchannel")
            .setDescription(opts.description ?? "Configure the music request channel.")
            .addSubcommand((sub) =>
                sub
                    .setName("set")
                    .setDescription(i18n.__("commands.music.requestChannel.slashSetDescription"))
                    .addChannelOption((opt) =>
                        opt
                            .setName("channel")
                            .setDescription(
                                i18n.__("commands.music.requestChannel.slashChannelDescription"),
                            )
                            .addChannelTypes(ChannelType.GuildText)
                            .setRequired(true),
                    ),
            )
            .addSubcommand((sub) =>
                sub
                    .setName("remove")
                    .setDescription(
                        i18n.__("commands.music.requestChannel.slashRemoveDescription"),
                    ),
            )
            .addSubcommand((sub) =>
                sub
                    .setName("status")
                    .setDescription(
                        i18n.__("commands.music.requestChannel.slashStatusDescription"),
                    ),
            ) as SlashCommandBuilder;
    },
})
export class RequestChannelCommand extends ContextCommand {
    private get client(): Rawon {
        return this.container.client as Rawon;
    }

    public async contextRun(ctx: CommandContext): Promise<Message | undefined> {
        const __ = i18n__(this.client, ctx.guild);
        const __mf = i18n__mf(this.client, ctx.guild);

        const hasPermission =
            ctx.member?.permissions.has(PermissionsBitField.Flags.ManageGuild) ?? false;
        if (!hasPermission) {
            return ctx.reply({
                embeds: [
                    createEmbed("error", __("commands.music.requestChannel.noPermission"), true),
                ],
            });
        }

        if (!ctx.guild) {
            return ctx.reply({
                embeds: [
                    createEmbed("error", __("commands.music.requestChannel.noPermission"), true),
                ],
            });
        }

        const subcommand = ctx.options?.getSubcommand() ?? ctx.args[0]?.toLowerCase();

        if (subcommand === "set") {
            const channel =
                ctx.options?.getChannel("channel") ??
                (ctx.args[1]
                    ? ctx.guild.channels.cache.get(ctx.args[1].replaceAll(/[<#>]/gu, ""))
                    : undefined);

            if (!channel || channel.type !== ChannelType.GuildText) {
                return ctx.reply({
                    embeds: [
                        createEmbed(
                            "error",
                            __("commands.music.requestChannel.invalidChannel"),
                            true,
                        ),
                    ],
                });
            }

            const currentChannel = this.client.requestChannelManager.getRequestChannel(ctx.guild);
            if (currentChannel) {
                return ctx.reply({
                    embeds: [
                        createEmbed(
                            "error",
                            __mf("commands.music.requestChannel.alreadyHasChannel", {
                                channel: `<#${currentChannel.id}>`,
                            }),
                            true,
                        ),
                    ],
                });
            }

            const isChannelUsedByAnyBot = this.client.requestChannelManager.isRequestChannel(
                ctx.guild,
                channel.id,
            );

            if (isChannelUsedByAnyBot) {
                return ctx.reply({
                    embeds: [
                        createEmbed(
                            "error",
                            __("commands.music.requestChannel.channelAlreadyInUse"),
                            true,
                        ),
                    ],
                });
            }

            const textChannel = channel as TextChannel;
            const botMember = ctx.guild.members.me;

            if (!botMember) {
                return ctx.reply({
                    embeds: [
                        createEmbed(
                            "error",
                            __("commands.music.requestChannel.noBotPermissions"),
                            true,
                        ),
                    ],
                });
            }

            const botPermissions = textChannel.permissionsFor(botMember);

            const requiredPermissions = [
                PermissionsBitField.Flags.ViewChannel,
                PermissionsBitField.Flags.SendMessages,
                PermissionsBitField.Flags.EmbedLinks,
                PermissionsBitField.Flags.ReadMessageHistory,
                PermissionsBitField.Flags.ManageMessages,
            ];

            const missingPermissions = requiredPermissions.filter(
                (perm) => !botPermissions.has(perm),
            );

            if (missingPermissions.length > 0) {
                const permissionNames = missingPermissions.map((perm) => {
                    const flagName = Object.entries(PermissionsBitField.Flags).find(
                        ([, value]) => value === perm,
                    )?.[0];
                    const spacedName = (flagName ?? "Unknown").replace(/([a-z])([A-Z])/g, "$1 $2");
                    return `**\`${spacedName}\`**`;
                });
                return ctx.reply({
                    embeds: [
                        createEmbed(
                            "error",
                            __mf("commands.music.requestChannel.missingBotPermissions", {
                                permissions: permissionNames.join(", "),
                            }),
                            true,
                        ),
                    ],
                });
            }

            await this.client.requestChannelManager.setRequestChannel(ctx.guild, channel.id);

            const playerMessage =
                await this.client.requestChannelManager.createOrUpdatePlayerMessage(ctx.guild);

            if (!playerMessage) {
                await this.client.requestChannelManager.setRequestChannel(ctx.guild, null);
                return ctx.reply({
                    embeds: [
                        createEmbed(
                            "error",
                            __("commands.music.requestChannel.failedToSetup"),
                            true,
                        ),
                    ],
                });
            }

            return ctx.reply({
                embeds: [
                    createEmbed(
                        "success",
                        __mf("requestChannel.setChannel", { channel: `<#${channel.id}>` }),
                        true,
                    ),
                ],
            });
        }

        if (subcommand === "remove") {
            const existingChannel = this.client.requestChannelManager.getRequestChannel(ctx.guild);
            if (!existingChannel) {
                return ctx.reply({
                    embeds: [
                        createEmbed(
                            "warn",
                            __("commands.music.requestChannel.noChannelToRemove"),
                            true,
                        ),
                    ],
                });
            }

            await this.client.requestChannelManager.setRequestChannel(ctx.guild, null);

            return ctx.reply({
                embeds: [createEmbed("success", __("requestChannel.removeChannel"), true)],
            });
        }

        const currentChannel = this.client.requestChannelManager.getRequestChannel(ctx.guild);

        if (currentChannel) {
            return ctx.reply({
                embeds: [
                    createEmbed(
                        "info",
                        __mf("requestChannel.currentChannel", {
                            channel: `<#${currentChannel.id}>`,
                        }),
                    ),
                ],
            });
        }

        return ctx.reply({
            embeds: [createEmbed("warn", __("requestChannel.noChannel"))],
        });
    }
}
