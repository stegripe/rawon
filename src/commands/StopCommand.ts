import { BaseCommand } from "../structures/BaseCommand";
import { IMessage } from "../../typings";
import { DefineCommand } from "../utils/decorators/DefineCommand";
import { isUserInTheVoiceChannel, isMusicPlaying, isSameVoiceChannel } from "../utils/decorators/MusicHelper";
import { createEmbed } from "../utils/createEmbed";

@DefineCommand({
    aliases: ["leave", "disconnect", "dc"],
    name: "stop",
    description: "Stop music player and delete the queue",
    usage: "{prefix}stop"
})
export class StopCommand extends BaseCommand {
    @isUserInTheVoiceChannel()
    @isMusicPlaying()
    @isSameVoiceChannel()
    public execute(message: IMessage): any {
        if (message.guild!.queue!.lastMusicMessageID !== null) message.guild!.queue!.textChannel?.messages.fetch(message.guild!.queue!.lastMusicMessageID, false).then(m => m.delete()).catch(e => this.client.logger.error("PLAY_ERR:", e));
        if (message.guild!.queue!.lastVoiceStateUpdateMessageID !== null) message.guild!.queue!.textChannel?.messages.fetch(message.guild!.queue!.lastVoiceStateUpdateMessageID, false).then(m => m.delete()).catch(e => this.client.logger.error("PLAY_ERR:", e));
        message.guild?.queue?.voiceChannel?.leave();
        message.guild!.queue = null;

        message.channel.send(createEmbed("info", "⏹  **|**  Stopped the music player and deleted the queue"))
            .catch(e => this.client.logger.error("STOP_CMD_ERR:", e));
    }
}
