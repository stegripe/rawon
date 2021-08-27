import { isMusicQueueExists, isSameVoiceChannel, isUserInTheVoiceChannel } from "../utils/decorators/MusicHelper";
import { DefineCommand } from "../utils/decorators/DefineCommand";
import { BaseCommand } from "../structures/BaseCommand";
import { createEmbed } from "../utils/createEmbed";
import { Message } from "discord.js";

@DefineCommand({
    description: "Pause the music player",
    name: "pause",
    usage: "{prefix}pause"
})
export class PauseCommand extends BaseCommand {
    @isUserInTheVoiceChannel()
    @isMusicQueueExists()
    @isSameVoiceChannel()
    public execute(message: Message): any {
        if (message.guild?.queue?.playing) {
            message.guild.queue.currentPlayer!.pause();
            return message.channel.send({ embeds: [createEmbed("info", "⏸ **|** The music player has been paused")] });
        }
        message.channel.send({ embeds: [createEmbed("error", "The music player is already paused")] })
            .catch(e => this.client.logger.error("PAUSE_CMD_ERR:", e));
    }
}
