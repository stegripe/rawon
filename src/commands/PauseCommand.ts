import { BaseCommand } from "../structures/BaseCommand";
import { IMessage } from "../../typings";
import { DefineCommand } from "../utils/decorators/DefineCommand";
import { isUserInTheVoiceChannel, isMusicPlaying, isSameVoiceChannel } from "../utils/decorators/MusicHelper";
import { createEmbed } from "../utils/createEmbed";

@DefineCommand({
    name: "pause",
    description: "Pause the music player",
    usage: "{prefix}pause"
})
export class PauseCommand extends BaseCommand {
    @isUserInTheVoiceChannel()
    @isMusicPlaying()
    @isSameVoiceChannel()
    public execute(message: IMessage): any {
        if (message.guild?.queue?.playing) {
            message.guild.queue.playing = false;
            message.guild.queue.connection?.dispatcher.pause();
            return message.channel.send(createEmbed("info", "⏸ **|** The music player has paused"));
        }
        message.channel.send(createEmbed("error", "The music player is already paused"))
            .catch(e => this.client.logger.error("PAUSE_CMD_ERR:", e));
    }
}
