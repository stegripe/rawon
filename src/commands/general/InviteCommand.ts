import { OAuth2Scopes, PermissionFlagsBits } from "discord.js";
import i18n from "../../config/index.js";
import { BaseCommand } from "../../structures/BaseCommand.js";
import { type CommandContext } from "../../structures/CommandContext.js";
import { Command } from "../../utils/decorators/Command.js";
import { createEmbed } from "../../utils/functions/createEmbed.js";
import { i18n__mf } from "../../utils/functions/i18n.js";

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

        const invite = this.client.generateInvite({
            permissions: [
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
            ],
            scopes: [OAuth2Scopes.Bot, OAuth2Scopes.ApplicationsCommands],
        });
        await ctx
            .send({
                embeds: [
                    createEmbed(
                        "info",
                        __mf("commands.general.invite.clickURL", {
                            url: invite,
                        }),
                    ).setAuthor({
                        name: __mf("commands.general.invite.inviteTitle", {
                            bot: this.client.user?.username,
                        }),
                        iconURL: this.client.user?.displayAvatarURL(),
                    }),
                ],
            })
            .catch((error: unknown) => this.client.logger.error("PLAY_CMD_ERR:", error));
    }
}
