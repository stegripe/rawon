import { CommandContext } from "../../structures/CommandContext";
import { BaseCommand } from "../../structures/BaseCommand";
import { createEmbed } from "../../utils/createEmbed";
import i18n from "../../config";
import { Permissions } from "discord.js";

export class InviteCommand extends BaseCommand {
    public constructor(client: BaseCommand["client"]) {
        super(client, {
            aliases: ["inv"],
            description: i18n.__("commands.general.invite.description"),
            name: "invite",
            slash: {
                options: []
            },
            usage: "{prefix}invite"
        });
    }

    public async execute(ctx: CommandContext): Promise<void> {
        const invite = await this.client.generateInvite({
            permissions: [
                Permissions.FLAGS.VIEW_CHANNEL,
                Permissions.FLAGS.SEND_MESSAGES,
                Permissions.FLAGS.USE_PUBLIC_THREADS,
                Permissions.FLAGS.USE_PRIVATE_THREADS,
                Permissions.FLAGS.EMBED_LINKS,
                Permissions.FLAGS.ATTACH_FILES,
                Permissions.FLAGS.USE_EXTERNAL_EMOJIS,
                Permissions.FLAGS.USE_EXTERNAL_STICKERS,
                Permissions.FLAGS.ADD_REACTIONS,
                Permissions.FLAGS.CONNECT,
                Permissions.FLAGS.SPEAK,
                Permissions.FLAGS.USE_VAD,
                Permissions.FLAGS.PRIORITY_SPEAKER,
                Permissions.FLAGS.READ_MESSAGE_HISTORY
            ],
            scopes: ["bot", "applications.commands"]
        });
        await ctx.send({
            embeds: [createEmbed("info", i18n.__mf("commands.general.invite.clickURL", { url: invite })).setAuthor(i18n.__mf("commands.general.invite.inviteTitle", { bot: this.client.user?.username }), this.client.user!.displayAvatarURL())]
        }).catch(e => this.client.logger.error("PLAY_CMD_ERR:", e));
    }
}
