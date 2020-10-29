import BaseCommand from "../structures/BaseCommand";
import { MessageEmbed } from "discord.js";
import type { IMessage } from "../../typings";
import type Disc_11 from "../structures/Disc_11";

export default class InviteCommand extends BaseCommand {
    public constructor(public client: Disc_11, public readonly path: string) {
        super(client, path, {
            disable: client.config.disableInviteCmd
        }, {
            name: "invite",
            description: "Send the bot's invite link",
            usage: "{prefix}invite"
        });
    }

    public async execute(message: IMessage): Promise<void> {
        message.channel.send(
            new MessageEmbed().addField("Discord bot invite link", `**[Click here to invite me](${await this.client.generateInvite({ permissions: 53857345 })})**`)
                .setColor(this.client.config.embedColor)
        ).catch(e => this.client.logger.error("PLAY_CMD_ERR:", e));
    }
}
