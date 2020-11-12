import { BaseCommand } from "../structures/BaseCommand";
import { IMessage } from "../../typings";
import { DefineCommand } from "../utils/decorators/DefineCommand";
import { createEmbed } from "../utils/createEmbed";

@DefineCommand({
    name: "invite",
    description: "Get the bot's invite link",
    usage: "{prefix}invite"
})
export default class InviteCommand extends BaseCommand {
    public async execute(message: IMessage): Promise<void> {
        message.channel.send(
            createEmbed("info")
            .addField("Discord bot invite link", `[Click here](${await this.client.generateInvite({ permissions: 53857345 })})`)
        ).catch(e => this.client.logger.error("PLAY_CMD_ERR:", e));
    }
}
