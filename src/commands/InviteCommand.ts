import { DefineCommand } from "../utils/decorators/DefineCommand";
import { BaseCommand } from "../structures/BaseCommand";
import { createEmbed } from "../utils/createEmbed";
import { disableInviteCmd } from "../config";
import { Message } from "discord.js";

@DefineCommand({
    description: "Send the bot's invite link",
    disable: disableInviteCmd,
    usage: "{prefix}invite",
    name: "invite"
})
export class InviteCommand extends BaseCommand {
    public async execute(message: Message): Promise<void> {
        message.channel.send(
            createEmbed("info")
                .addField("Invite Link", `**[Click here](${await this.client.generateInvite({ permissions: 53857345 })})** to invite this bot to your server.`)
        ).catch(e => this.client.logger.error("PLAY_CMD_ERR:", e));
    }
}
