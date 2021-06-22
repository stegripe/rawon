import { DefineCommand } from "../utils/decorators/DefineCommand";
import { BaseCommand } from "../structures/BaseCommand";
import { createEmbed } from "../utils/createEmbed";
import { disableInviteCmd } from "../config";
import { IMessage } from "../../typings";

@DefineCommand({
    description: "Send the bot's invite link",
    disable: disableInviteCmd,
    name: "invite",
    usage: "{prefix}invite"
})
export class InviteCommand extends BaseCommand {
    public async execute(message: IMessage): Promise<void> {
        message.channel.send(
            createEmbed("info")
                .addField(`${this.client.user!.tag} - Invite Link`, `**[Click here to invite this bot](${await this.client.generateInvite({ permissions: 53857345 })})**`)
        ).catch(e => this.client.logger.error("PLAY_CMD_ERR:", e));
    }
}
