import { isMusicQueueExists, isSameVoiceChannel, isUserInTheVoiceChannel } from "../utils/decorators/MusicHelper";
import { DefineCommand } from "../utils/decorators/DefineCommand";
import { BaseCommand } from "../structures/BaseCommand";
import { createEmbed } from "../utils/createEmbed";
import { Message } from "discord.js";

@DefineCommand({
    description: "Resume the music player",
    name: "resume",
    usage: "{prefix}resume",
    aliases: ["unpause"]
})
export class ResumeCommand extends BaseCommand {
    @isUserInTheVoiceChannel()
    @isMusicQueueExists()
    @isSameVoiceChannel()
    public execute(message: Message): any {
        if (message.guild?.queue?.playing) {
            message.channel.send({ embeds: [createEmbed("error", "The music player is not paused")] }).catch(e => this.client.logger.error("RESUME_CMD_ERR:", e));
        } else {
            message.guild?.queue?.currentPlayer!.unpause();
            message.channel.send({ embeds: [createEmbed("info", "▶ **|** The music player has been resumed")] }).catch(e => this.client.logger.error("RESUME_CMD_ERR:", e));
        }
    }
}
