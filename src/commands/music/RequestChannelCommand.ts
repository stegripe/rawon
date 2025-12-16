import { ApplicationCommandOptionType, ChannelType, Message, PermissionsBitField } from "discord.js";
import i18n from "../../config/index.js";
import { BaseCommand } from "../../structures/BaseCommand.js";
import { CommandContext } from "../../structures/CommandContext.js";
import { Command } from "../../utils/decorators/Command.js";
import { createEmbed } from "../../utils/functions/createEmbed.js";

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
                        description: i18n.__("commands.music.requestChannel.slashChannelDescription"),
                        name: "channel",
                        type: ApplicationCommandOptionType.Channel,
                        channelTypes: [ChannelType.GuildText],
                        required: true
                    }
                ]
            },
            {
                description: i18n.__("commands.music.requestChannel.slashRemoveDescription"),
                name: "remove",
                type: ApplicationCommandOptionType.Subcommand
            },
            {
                description: i18n.__("commands.music.requestChannel.slashStatusDescription"),
                name: "status",
                type: ApplicationCommandOptionType.Subcommand
            }
        ]
    },
    usage: i18n.__("commands.music.requestChannel.usage")
})
export class RequestChannelCommand extends BaseCommand {
    public async execute(ctx: CommandContext): Promise<Message | undefined> {
        const hasPermission = ctx.member?.permissions.has(PermissionsBitField.Flags.ManageGuild) ?? false;
        if (!hasPermission) {
            return ctx.reply({
                embeds: [createEmbed("error", i18n.__("commands.music.requestChannel.noPermission"), true)]
            });
        }

        if (!ctx.guild) {
            return ctx.reply({
                embeds: [createEmbed("error", i18n.__("commands.music.requestChannel.noPermission"), true)]
            });
        }

        const subcommand = ctx.options?.getSubcommand() ?? ctx.args[0]?.toLowerCase();

        if (subcommand === "set") {
            const channel = ctx.options?.getChannel("channel") ?? 
                (ctx.args[1] ? ctx.guild.channels.cache.get(ctx.args[1].replaceAll(/[<#>]/gu, "")) : undefined);

            if (!channel || channel.type !== ChannelType.GuildText) {
                return ctx.reply({
                    embeds: [createEmbed("error", i18n.__("commands.music.requestChannel.invalidChannel"), true)]
                });
            }

            await this.client.requestChannelManager.setRequestChannel(ctx.guild, channel.id);
            
            await this.client.requestChannelManager.createOrUpdatePlayerMessage(ctx.guild);

            return ctx.reply({
                embeds: [createEmbed("success", i18n.__mf("requestChannel.setChannel", { channel: `<#${channel.id}>` }), true)]
            });
        }

        if (subcommand === "remove") {
            await this.client.requestChannelManager.setRequestChannel(ctx.guild, null);

            return ctx.reply({
                embeds: [createEmbed("success", i18n.__("requestChannel.removeChannel"), true)]
            });
        }

        const currentChannel = this.client.requestChannelManager.getRequestChannel(ctx.guild);

        if (currentChannel) {
            return ctx.reply({
                embeds: [createEmbed("info", i18n.__mf("requestChannel.currentChannel", { channel: `<#${currentChannel.id}>` }))]
            });
        }

        return ctx.reply({
            embeds: [createEmbed("warn", i18n.__("requestChannel.noChannel"))]
        });
    }
}
