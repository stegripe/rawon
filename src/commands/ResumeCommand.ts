import BaseCommand from "../structures/BaseCommand";
import { MessageEmbed } from "discord.js";
import type { ICommandComponent, IMessage } from "../../typings";
import type Disc_11 from "../structures/Disc_11";
import { DefineCommand } from "../utils/decorators/DefineCommand";
import { isMemberInTheVoiceChannel, isMusicPlaying, isSameVoiceChannel } from "../utils/decorators/MusicHelper";

@DefineCommand({
    name: "resume",
    description: "Resume the paused track",
    usage: "{prefix}resume"
})
export default class ResumeCommand extends BaseCommand {
    public constructor(public client: Disc_11, public meta: ICommandComponent["meta"]) { super(client, meta); }

    @isMemberInTheVoiceChannel()
    @isMusicPlaying()
    @isSameVoiceChannel()
    public execute(message: IMessage): any {
        if (message.guild?.queue?.playing) {
            message.channel.send(new MessageEmbed().setDescription("Music is not paused.").setColor("YELLOW")).catch(e => this.client.logger.error("RESUME_CMD_ERR:", e));
        } else {
            message.guild!.queue!.playing = true;
            message.guild?.queue?.connection?.dispatcher.resume();
            message.channel.send(new MessageEmbed().setDescription("▶  **|**  Resumed the music for you").setColor(this.client.config.embedColor)).catch(e => this.client.logger.error("RESUME_CMD_ERR:", e));
        }
    }
}
