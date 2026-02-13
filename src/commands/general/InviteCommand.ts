/** biome-ignore-all lint/style/useNamingConvention: disable naming convention rule for this file */
import { ApplyOptions } from "@sapphire/decorators";
import { type Command } from "@sapphire/framework";
import { type CommandContext, ContextCommand } from "@stegripe/command-context";
import { OAuth2Scopes, PermissionFlagsBits, type SlashCommandBuilder } from "discord.js";
import { isMultiBot } from "../../config/env.js";
import i18n from "../../config/index.js";
import { type Rawon } from "../../structures/Rawon.js";
import { createEmbed } from "../../utils/functions/createEmbed.js";
import { i18n__mf } from "../../utils/functions/i18n.js";
import { MultiBotManager } from "../../utils/structures/MultiBotManager.js";

const SetVoiceChannelStatus = 281474976710656n;

@ApplyOptions<Command.Options>({
    name: "invite",
    aliases: ["inv"],
    description: i18n.__("commands.general.invite.description"),
    detailedDescription: { usage: "{prefix}invite" },
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
            .setName(opts.name ?? "invite")
            .setDescription(
                opts.description ?? "Get the invite link for the bot.",
            ) as SlashCommandBuilder;
    },
})
export class InviteCommand extends ContextCommand {
    public async contextRun(ctx: CommandContext): Promise<void> {
        const client = ctx.client as Rawon;
        const __mf = i18n__mf(client, ctx.guild);

        const permissions = [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ManageMessages,
            PermissionFlagsBits.EmbedLinks,
            PermissionFlagsBits.AttachFiles,
            PermissionFlagsBits.ReadMessageHistory,
            PermissionFlagsBits.UseExternalEmojis,
            PermissionFlagsBits.AddReactions,
            PermissionFlagsBits.Connect,
            PermissionFlagsBits.Speak,
            PermissionFlagsBits.UseVAD,
            PermissionFlagsBits.RequestToSpeak,
            PermissionFlagsBits.SendMessagesInThreads,
            PermissionFlagsBits.SendVoiceMessages,
            SetVoiceChannelStatus,
            PermissionFlagsBits.BypassSlowmode,
        ];

        let description: string;
        let title: string;

        if (isMultiBot) {
            const multiBotManager = MultiBotManager.getInstance();
            const bots = multiBotManager.getBots();

            if (bots.length === 0) {
                const invite = client.generateInvite({
                    permissions,
                    scopes: [OAuth2Scopes.Bot, OAuth2Scopes.ApplicationsCommands],
                });
                description = __mf("commands.general.invite.clickURL", {
                    url: invite,
                });
                title = __mf("commands.general.invite.inviteTitle", {
                    bot: client.user?.username,
                });
            } else {
                const inviteLines = bots
                    .sort((a, b) => a.tokenIndex - b.tokenIndex)
                    .map((bot) => {
                        const invite = bot.client.generateInvite({
                            permissions,
                            scopes: [OAuth2Scopes.Bot, OAuth2Scopes.ApplicationsCommands],
                        });
                        const botNum = bot.tokenIndex + 1;
                        return __mf("commands.general.invite.clickURL", {
                            url: invite,
                            botNum: `**#${botNum}**`,
                        });
                    });
                description = inviteLines.join("\n");
                title = __mf("commands.general.invite.inviteTitle", {
                    bot: client.user?.username ?? "Multi-Bot",
                });
            }
        } else {
            const invite = client.generateInvite({
                permissions,
                scopes: [OAuth2Scopes.Bot, OAuth2Scopes.ApplicationsCommands],
            });
            description = __mf("commands.general.invite.clickURL", {
                url: invite,
                botNum: "",
            });
            title = __mf("commands.general.invite.inviteTitle", {
                bot: client.user?.username,
            });
        }

        await ctx
            .send({
                embeds: [
                    createEmbed("info", description).setAuthor({
                        name: title,
                        iconURL: client.user?.displayAvatarURL(),
                    }),
                ],
            })
            .catch((error: unknown) => this.container.logger.error("INVITE_CMD_ERR:", error));
    }
}
