import { BaseCommand } from "../structures/BaseCommand";
import { IMessage } from "../../typings";
import { DefineCommand } from "../utils/decorators/DefineCommand";
import { isUserInTheVoiceChannel, isMusicPlaying, isSameVoiceChannel } from "../utils/decorators/MusicHelper";
import { createEmbed } from "../utils/createEmbed";

@DefineCommand({
    name: "resume",
    description: "Resume the music player",
    usage: "{prefix}resume"
})
export class ResumeCommand extends BaseCommand {
    @isUserInTheVoiceChannel()
    @isMusicPlaying()
    @isSameVoiceChannel()
    public execute(message: IMessage): any {
        if (message.guild?.queue?.playing) {
            message.channel.send(createEmbed("error", "The music player is not paused")).catch(e => this.client.logger.error("RESUME_CMD_ERR:", e));
        } else {
            message.guild!.queue!.playing = true;
            message.guild?.queue?.connection?.dispatcher.resume();
            message.channel.send(createEmbed("info", "▶ **|** The music player has resumed")).catch(e => this.client.logger.error("RESUME_CMD_ERR:", e));
        }
    }
}
