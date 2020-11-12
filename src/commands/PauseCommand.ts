import BaseCommand from "../structures/BaseCommand";
import { MessageEmbed } from "discord.js";
import type { ICommandComponent, IMessage } from "../../typings";
import type Disc_11 from "../structures/Disc_11";
import { DefineCommand } from "../utils/decorators/DefineCommand";
import { isUserInTheVoiceChannel, isMusicPlaying, isSameVoiceChannel } from "../utils/decorators/MusicHelper";

@DefineCommand({
    name: "pause",
    description: "Pause the track",
    usage: "{prefix}pause"
})
export default class PauseCommand extends BaseCommand {
    public constructor(public client: Disc_11, public meta: ICommandComponent["meta"]) { super(client, meta); }

    @isUserInTheVoiceChannel()
    @isMusicPlaying()
    @isSameVoiceChannel()
    public execute(message: IMessage): any {
        if (message.guild?.queue?.playing) {
            message.guild.queue.playing = false;
            message.guild.queue.connection?.dispatcher.pause();
            return message.channel.send(new MessageEmbed().setDescription("⏸  **|**  Paused the music for you").setColor(this.client.config.embedColor));
        }
        message.channel.send(new MessageEmbed().setDescription("Music is already paused.").setColor("YELLOW"))
            .catch(e => this.client.logger.error("PAUSE_CMD_ERR:", e));
    }
}
