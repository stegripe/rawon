import { CommandContext } from "../../structures/CommandContext.js";
import { createEmbed } from "../../utils/functions/createEmbed.js";
import { BaseCommand } from "../../structures/BaseCommand.js";
import { Command } from "../../utils/decorators/Command.js";
import i18n from "../../config/index.js";
import { OAuth2Scopes, PermissionFlagsBits } from "discord.js";

@Command({
    aliases: ["inv"],
    description: i18n.__("commands.general.invite.description"),
    name: "invite",
    slash: {
        options: []
    },
    usage: "{prefix}invite"
})
export class InviteCommand extends BaseCommand {
    public async execute(ctx: CommandContext): Promise<void> {
        const invite = this.client.generateInvite({
            permissions: [
                PermissionFlagsBits.ViewChannel,
                PermissionFlagsBits.SendMessages,
                PermissionFlagsBits.CreatePublicThreads,
                PermissionFlagsBits.CreatePrivateThreads,
                PermissionFlagsBits.EmbedLinks,
                PermissionFlagsBits.AttachFiles,
                PermissionFlagsBits.UseExternalEmojis,
                PermissionFlagsBits.UseExternalStickers,
                PermissionFlagsBits.AddReactions,
                PermissionFlagsBits.Connect,
                PermissionFlagsBits.Speak,
                PermissionFlagsBits.UseVAD,
                PermissionFlagsBits.PrioritySpeaker,
                PermissionFlagsBits.ReadMessageHistory
            ],
            scopes: [OAuth2Scopes.Bot, OAuth2Scopes.ApplicationsCommands]
        });
        await ctx
            .send({
                embeds: [
                    createEmbed(
                        "info",
                        i18n.__mf("commands.general.invite.clickURL", {
                            url: invite
                        })
                    ).setAuthor({
                        name: i18n.__mf("commands.general.invite.inviteTitle", {
                            bot: this.client.user?.username
                        }),
                        iconURL: this.client.user!.displayAvatarURL()
                    })
                ]
            })
            .catch(e => this.client.logger.error("PLAY_CMD_ERR:", e));
    }
}
