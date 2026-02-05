import { OAuth2Scopes, PermissionFlagsBits } from "discord.js";
import { isMultiBot } from "../../config/env.js";
import i18n from "../../config/index.js";
import { BaseCommand } from "../../structures/BaseCommand.js";
import { type CommandContext } from "../../structures/CommandContext.js";
import { Command } from "../../utils/decorators/Command.js";
import { createEmbed } from "../../utils/functions/createEmbed.js";
import { i18n__mf } from "../../utils/functions/i18n.js";
import { MultiBotManager } from "../../utils/structures/MultiBotManager.js";

const SetVoiceChannelStatus = 281474976710656n;

@Command({
    aliases: ["inv"],
    description: i18n.__("commands.general.invite.description"),
    name: "invite",
    slash: {
        options: [],
    },
    usage: "{prefix}invite",
})
export class InviteCommand extends BaseCommand {
    public async execute(ctx: CommandContext): Promise<void> {
        const __mf = i18n__mf(this.client, ctx.guild);

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
                const invite = this.client.generateInvite({
                    permissions,
                    scopes: [OAuth2Scopes.Bot, OAuth2Scopes.ApplicationsCommands],
                });
                description = __mf("commands.general.invite.clickURL", {
                    url: invite,
                });
                title = __mf("commands.general.invite.inviteTitle", {
                    bot: this.client.user?.username,
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
                    bot: this.client.user?.username ?? "Multi-Bot",
                });
            }
        } else {
            const invite = this.client.generateInvite({
                permissions,
                scopes: [OAuth2Scopes.Bot, OAuth2Scopes.ApplicationsCommands],
            });
            description = __mf("commands.general.invite.clickURL", {
                url: invite,
                botNum: "",
            });
            title = __mf("commands.general.invite.inviteTitle", {
                bot: this.client.user?.username,
            });
        }

        await ctx
            .send({
                embeds: [
                    createEmbed("info", description).setAuthor({
                        name: title,
                        iconURL: this.client.user?.displayAvatarURL(),
                    }),
                ],
            })
            .catch((error: unknown) => this.client.logger.error("PLAY_CMD_ERR:", error));
    }
}
