import { DefineCommand } from "../utils/decorators/DefineCommand";
import { BaseCommand } from "../structures/BaseCommand";
import { createEmbed } from "../utils/createEmbed";
import { disableInviteCmd } from "../config";
import { Message, Permissions } from "discord.js";

@DefineCommand({
    description: "Send the bot's invite link",
    disable: disableInviteCmd,
    name: "invite",
    usage: "{prefix}invite"
})
export class InviteCommand extends BaseCommand {
    public async execute(message: Message): Promise<void> {
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
                Permissions.FLAGS.PRIORITY_SPEAKER
            ],
            scopes: ["bot", "applications.commands"]
        });
        message.channel.send({
            embeds: [
                createEmbed("info")
                    .addField(`Invite link - ${this.client.user!.tag}`, `**[Click here to invite this bot](${invite})**`)
            ]
        }).catch(e => this.client.logger.error("PLAY_CMD_ERR:", e));
    }
}
