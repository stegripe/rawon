import {
    ApplicationCommandOptionType,
    ChannelType,
    type Message,
    PermissionsBitField,
    type TextChannel,
} from "discord.js";
import i18n from "../../config/index.js";
import { BaseCommand } from "../../structures/BaseCommand.js";
import { type CommandContext } from "../../structures/CommandContext.js";
import { Command } from "../../utils/decorators/Command.js";
import { createEmbed } from "../../utils/functions/createEmbed.js";
import { i18n__, i18n__mf } from "../../utils/functions/i18n.js";

@Command({
    aliases: ["rc", "reqchannel", "musicchannel"],
    description: i18n.__("commands.music.requestChannel.description"),
    name: "requestchannel",
    slash: {
        options: [
            {
                description: i18n.__("commands.music.requestChannel.slashSetDescription"),
                name: "set",
                type: ApplicationCommandOptionType.Subcommand,
                options: [
                    {
                        description: i18n.__(
                            "commands.music.requestChannel.slashChannelDescription",
                        ),
                        name: "channel",
                        type: ApplicationCommandOptionType.Channel,
                        channelTypes: [ChannelType.GuildText],
                        required: true,
                    },
                ],
            },
            {
                description: i18n.__("commands.music.requestChannel.slashRemoveDescription"),
                name: "remove",
                type: ApplicationCommandOptionType.Subcommand,
            },
            {
                description: i18n.__("commands.music.requestChannel.slashStatusDescription"),
                name: "status",
                type: ApplicationCommandOptionType.Subcommand,
            },
        ],
    },
    usage: i18n.__("commands.music.requestChannel.usage"),
})
export class RequestChannelCommand extends BaseCommand {
    public async execute(ctx: CommandContext): Promise<Message | undefined> {
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

            // Check if this guild already has a request channel set to a different channel
            const currentChannel = this.client.requestChannelManager.getRequestChannel(ctx.guild);
            if (currentChannel && currentChannel.id !== channel.id) {
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

            // Check if this channel is already used as a request channel (for multi-bot duplication prevention)
            if (this.client.requestChannelManager.isRequestChannel(ctx.guild, channel.id)) {
                const existingChannel = this.client.requestChannelManager.getRequestChannel(
                    ctx.guild,
                );
                if (existingChannel?.id !== channel.id) {
                    // Another bot already has this channel as a request channel
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
                    return flagName ?? "Unknown";
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
