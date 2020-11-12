import BaseCommand from "../structures/BaseCommand";
import { ICommandComponent, IMessage } from "../../typings";
import Disc_11 from "../structures/Disc_11";
import { DefineCommand } from "../utils/decorators/DefineCommand";
import { isUserInTheVoiceChannel, isMusicPlaying, isSameVoiceChannel } from "../utils/decorators/MusicHelper";
import { createEmbed } from "../utils/createEmbed";

@DefineCommand({
    name: "resume",
    description: "Resume the paused track",
    usage: "{prefix}resume"
})
export default class ResumeCommand extends BaseCommand {
    public constructor(public client: Disc_11, public meta: ICommandComponent["meta"]) { super(client, meta); }

    @isUserInTheVoiceChannel()
    @isMusicPlaying()
    @isSameVoiceChannel()
    public execute(message: IMessage): any {
        if (message.guild?.queue?.playing) {
            message.channel.send(createEmbed("warn", "Music is not paused.")).catch(e => this.client.logger.error("RESUME_CMD_ERR:", e));
        } else {
            message.guild!.queue!.playing = true;
            message.guild?.queue?.connection?.dispatcher.resume();
            message.channel.send(createEmbed("info", "▶  **|**  Resumed the music for you")).catch(e => this.client.logger.error("RESUME_CMD_ERR:", e));
        }
    }
}
