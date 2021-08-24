import { isMusicQueueExists, isSameVoiceChannel, isUserInTheVoiceChannel } from "../utils/decorators/MusicHelper";
import { DefineCommand } from "../utils/decorators/DefineCommand";
import { BaseCommand } from "../structures/BaseCommand";
import { createEmbed } from "../utils/createEmbed";
import { Message } from "discord.js";

@DefineCommand({
    aliases: ["st", "disconnect", "dc"],
    description: "Stop the music player",
    name: "stop",
    usage: "{prefix}stop"
})
export class StopCommand extends BaseCommand {
    @isUserInTheVoiceChannel()
    @isMusicQueueExists()
    @isSameVoiceChannel()
    public execute(message: Message): any {
        message.guild?.queue?.songs.clear();
        message.guild?.queue?.currentPlayer?.stop(true);
        message.guild!.queue!.oldMusicMessage = null; message.guild!.queue!.oldVoiceStateUpdateMessage = null;

        message.channel.send({ embeds: [createEmbed("info", "⏹ **|** The music player has been stopped")] })
            .catch(e => this.client.logger.error("STOP_CMD_ERR:", e));
    }
}
