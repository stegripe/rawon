import BaseCommand from "../structures/BaseCommand";
import { ICommandComponent, IMessage } from "../../typings";
import Disc_11 from "../structures/Disc_11";
import { DefineCommand } from "../utils/decorators/DefineCommand";
import { createEmbed } from "../utils/createEmbed";

@DefineCommand({
    name: "invite",
    description: "Get the bot's invite link",
    usage: "{prefix}invite"
})
export default class InviteCommand extends BaseCommand {
    public constructor(public client: Disc_11, public meta: ICommandComponent["meta"]) {
        super(client, Object.assign(meta, { disable: client.config.disableInviteCmd }));
    }

    public async execute(message: IMessage): Promise<void> {
        message.channel.send(
            ncreateEmbed("info")
            .addField("Discord bot invite link", `[Click here](${await this.client.generateInvite({ permissions: 53857345 })})`)
        ).catch(e => this.client.logger.error("PLAY_CMD_ERR:", e));
    }
}
