import BaseCommand from "../structures/BaseCommand";
import { MessageEmbed } from "discord.js";
import type { IMessage } from "../../typings";
import type Jukebox from "../structures/Jukebox";

export default class InviteCommand extends BaseCommand {
    public constructor(public client: Jukebox, public readonly path: string) {
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
            new MessageEmbed().addField("Discord bot invite link", `[Click here](${await this.client.generateInvite({ permissions: 53857345 })})`)
                .setColor("#00FF00")
        ).catch(e => this.client.logger.error("PLAY_CMD_ERR:", e));
    }
}
